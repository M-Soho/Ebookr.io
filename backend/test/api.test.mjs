// End-to-end API integration tests for the Ebookr backend.
// Uses Node's built-in test runner + global fetch — no extra dependencies.
// Requires the dev server running (npm run dev) and the demo seeded (npm run seed).
//   Run: npm test   (or: node --test)
import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:4001";
const rnd = () => Math.random().toString(36).slice(2, 10);

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, data };
}

async function register(name = "User") {
  const email = `t_${rnd()}@example.com`;
  const r = await api("/api/auth/register", {
    method: "POST",
    body: { name, email, password: "pw123456" },
  });
  assert.equal(r.status, 201, "register should return 201");
  return { email, token: r.data.token, user: r.data.user };
}

let A; // shared primary user

before(async () => {
  const h = await api("/api/health");
  assert.equal(h.status, 200, `backend must be running at ${BASE} (npm run dev)`);
  A = await register("Alice");
});

// ── Health ───────────────────────────────────────────────────────────────────
test("health: ok", async () => {
  const r = await api("/api/health");
  assert.equal(r.data.status, "ok");
});

// ── Auth ─────────────────────────────────────────────────────────────────────
test("auth: new account defaults to free plan", () => {
  assert.equal(A.user.plan, "free");
});

test("auth: duplicate email -> 409", async () => {
  const r = await api("/api/auth/register", {
    method: "POST",
    body: { name: "x", email: A.email, password: "pw123456" },
  });
  assert.equal(r.status, 409);
});

test("auth: short password -> 400", async () => {
  const r = await api("/api/auth/register", {
    method: "POST",
    body: { name: "x", email: `t_${rnd()}@example.com`, password: "short" },
  });
  assert.equal(r.status, 400);
});

test("auth: login ok, wrong password -> 401", async () => {
  const ok = await api("/api/auth/login", {
    method: "POST",
    body: { email: A.email, password: "pw123456" },
  });
  assert.equal(ok.status, 200);
  assert.ok(ok.data.token);
  const bad = await api("/api/auth/login", {
    method: "POST",
    body: { email: A.email, password: "nope" },
  });
  assert.equal(bad.status, 401);
});

test("auth: /me requires a valid token", async () => {
  assert.equal((await api("/api/auth/me")).status, 401);
  assert.equal((await api("/api/auth/me", { token: "garbage" })).status, 401);
  const me = await api("/api/auth/me", { token: A.token });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, A.email);
});

// ── Contacts CRUD + search + filter ──────────────────────────────────────────
test("contacts: full CRUD + search + status filter + tags", async () => {
  const created = await api("/api/contacts", {
    method: "POST",
    token: A.token,
    body: {
      firstName: "Marcus",
      lastName: "Bell",
      company: "Bell Co",
      email: "marcus@bell.co",
      status: "prospect",
      tags: ["legal", "b2b"],
    },
  });
  assert.equal(created.status, 201);
  const id = created.data.contact.id;
  assert.deepEqual(created.data.contact.tags, ["legal", "b2b"]);

  const list = await api("/api/contacts", { token: A.token });
  assert.ok(list.data.contacts.some((c) => c.id === id));

  const hit = await api("/api/contacts?q=Marcus", { token: A.token });
  assert.ok(hit.data.contacts.some((c) => c.id === id));
  const miss = await api("/api/contacts?q=zzznomatch", { token: A.token });
  assert.ok(!miss.data.contacts.some((c) => c.id === id));

  const filtered = await api("/api/contacts?status=prospect", { token: A.token });
  assert.ok(filtered.data.contacts.every((c) => c.status === "prospect"));

  const updated = await api(`/api/contacts/${id}`, {
    method: "PUT",
    token: A.token,
    body: { firstName: "Marcus", lastName: "Bell", status: "client", tags: [] },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.contact.status, "client");

  assert.equal((await api(`/api/contacts/${id}`, { token: A.token })).status, 200);

  assert.equal(
    (await api(`/api/contacts/${id}`, { method: "DELETE", token: A.token })).status,
    200
  );
  assert.equal((await api(`/api/contacts/${id}`, { token: A.token })).status, 404);
});

test("contacts: missing firstName -> 400 validation", async () => {
  const r = await api("/api/contacts", {
    method: "POST",
    token: A.token,
    body: { lastName: "NoFirst" },
  });
  assert.equal(r.status, 400);
});

// ── Tenant isolation (userId scoping) ────────────────────────────────────────
test("isolation: user B cannot read/update/delete user A's contact", async () => {
  const c = await api("/api/contacts", {
    method: "POST",
    token: A.token,
    body: { firstName: "Secret" },
  });
  const id = c.data.contact.id;
  const B = await register("Bob");

  assert.equal((await api(`/api/contacts/${id}`, { token: B.token })).status, 404);
  assert.equal(
    (await api(`/api/contacts/${id}`, { method: "PUT", token: B.token, body: { firstName: "Hacked" } })).status,
    404
  );
  assert.equal(
    (await api(`/api/contacts/${id}`, { method: "DELETE", token: B.token })).status,
    404
  );
  const bList = await api("/api/contacts", { token: B.token });
  assert.ok(!bList.data.contacts.some((x) => x.id === id));
});

// ── Reminders ────────────────────────────────────────────────────────────────
test("reminders: overdue/upcoming/completed + complete toggle + delete", async () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  const future = new Date(Date.now() + 86400000).toISOString();

  const r1 = await api("/api/reminders", {
    method: "POST",
    token: A.token,
    body: { title: "Overdue call", type: "call", dueAt: past },
  });
  assert.equal(r1.status, 201);
  const overdueId = r1.data.reminder.id;

  const r2 = await api("/api/reminders", {
    method: "POST",
    token: A.token,
    body: { title: "Future email", type: "email", dueAt: future },
  });
  const futureId = r2.data.reminder.id;

  const overdue = await api("/api/reminders?filter=overdue", { token: A.token });
  assert.ok(overdue.data.reminders.some((r) => r.id === overdueId));
  assert.ok(!overdue.data.reminders.some((r) => r.id === futureId));

  const upcoming = await api("/api/reminders?filter=upcoming", { token: A.token });
  assert.ok(upcoming.data.reminders.some((r) => r.id === futureId));

  const done = await api(`/api/reminders/${overdueId}/complete`, {
    method: "PATCH",
    token: A.token,
    body: { completed: true },
  });
  assert.equal(done.status, 200);
  assert.ok(done.data.reminder.completedAt);

  const completed = await api("/api/reminders?filter=completed", { token: A.token });
  assert.ok(completed.data.reminders.some((r) => r.id === overdueId));

  assert.equal(
    (await api(`/api/reminders/${futureId}`, { method: "DELETE", token: A.token })).status,
    200
  );
});

test("reminders: linking another user's contact -> 400", async () => {
  const B = await register("Carol");
  const c = await api("/api/contacts", {
    method: "POST",
    token: B.token,
    body: { firstName: "BsContact" },
  });
  const r = await api("/api/reminders", {
    method: "POST",
    token: A.token,
    body: { title: "x", dueAt: new Date().toISOString(), contactId: c.data.contact.id },
  });
  assert.equal(r.status, 400);
});

// ── Interactions ─────────────────────────────────────────────────────────────
test("interactions: logged interaction appears on the contact timeline", async () => {
  const c = await api("/api/contacts", {
    method: "POST",
    token: A.token,
    body: { firstName: "Dana" },
  });
  const id = c.data.contact.id;
  const i = await api(`/api/contacts/${id}/interactions`, {
    method: "POST",
    token: A.token,
    body: { type: "note", summary: "Said hello" },
  });
  assert.equal(i.status, 201);
  const detail = await api(`/api/contacts/${id}`, { token: A.token });
  assert.ok(detail.data.contact.interactions.some((x) => x.summary === "Said hello"));
});

// ── Dashboard ────────────────────────────────────────────────────────────────
test("dashboard: returns stats, pipeline, and plan", async () => {
  const d = await api("/api/dashboard", { token: A.token });
  assert.equal(d.status, 200);
  assert.equal(typeof d.data.stats.totalContacts, "number");
  assert.ok(d.data.pipeline);
  assert.ok(d.data.plan);
});

// ── AI email plan gating ─────────────────────────────────────────────────────
test("ai/email: free user is blocked with 402 plan_limit", async () => {
  const c = await api("/api/contacts", {
    method: "POST",
    token: A.token,
    body: { firstName: "Eve" },
  });
  const r = await api("/api/ai/email", {
    method: "POST",
    token: A.token,
    body: { contactId: c.data.contact.id, intent: "say hi" },
  });
  assert.equal(r.status, 402);
  assert.equal(r.data.code, "plan_limit");
});

test("ai/email: pro user (demo) gets a draft (template fallback w/o API key)", async () => {
  const login = await api("/api/auth/login", {
    method: "POST",
    body: { email: "demo@ebookr.io", password: "demo1234" },
  });
  assert.equal(login.status, 200, "demo account must be seeded (npm run seed)");
  const token = login.data.token;
  const contacts = await api("/api/contacts", { token });
  assert.ok(contacts.data.contacts.length > 0, "demo should have seeded contacts");
  const r = await api("/api/ai/email", {
    method: "POST",
    token,
    body: {
      contactId: contacts.data.contacts[0].id,
      intent: "Check in after our last call",
      tone: "professional",
    },
  });
  assert.equal(r.status, 200);
  assert.ok(r.data.draft.subject && r.data.draft.body);
  assert.equal(r.data.draft.fallback, true); // no ANTHROPIC_API_KEY in dev
});
