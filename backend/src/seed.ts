import bcrypt from "bcryptjs";
import { prisma } from "./db.js";

// Seeds a demo account so the dashboard has data to review immediately.
// Login: demo@ebookr.io / demo1234
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const email = "demo@ebookr.io";
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: "Demo Freelancer",
      email,
      passwordHash: await bcrypt.hash("demo1234", 10),
      emailVerified: true,
      plan: "pro",
    },
  });
  const userId = user.id;
  const now = Date.now();

  const seedContacts = [
    { firstName: "Ava", lastName: "Nguyen", company: "Brightside Studio", status: "client", email: "ava@brightside.co", tags: ["design", "retainer"] },
    { firstName: "Marcus", lastName: "Bell", company: "Bell & Co Law", status: "prospect", email: "marcus@bellco.com", tags: ["legal"] },
    { firstName: "Priya", lastName: "Shah", company: "Shah Bakery", status: "lead", email: "priya@shahbakery.com", tags: ["local", "web"] },
    { firstName: "Tom", lastName: "Okafor", company: "Okafor Fitness", status: "client", email: "tom@okaforfit.com", tags: ["video"] },
    { firstName: "Lena", lastName: "Karlsson", company: "Nordic Home", status: "prospect", email: "lena@nordichome.se", tags: ["ecom"] },
    { firstName: "Diego", lastName: "Ramos", company: "Ramos Auto", status: "inactive", email: "diego@ramosauto.com", tags: [] },
    { firstName: "Sara", lastName: "Idris", company: "Idris Consulting", status: "lead", email: "sara@idris.io", tags: ["b2b"] },
  ];

  const contacts: { id: string; firstName: string }[] = [];
  for (const c of seedContacts) {
    contacts.push(
      await prisma.contact.create({
        data: {
          userId,
          firstName: c.firstName,
          lastName: c.lastName,
          company: c.company,
          email: c.email,
          status: c.status,
          tags: JSON.stringify(c.tags),
          notes: null,
        },
      })
    );
  }
  const byName = (n: string) => contacts.find((c) => c.firstName === n)!;

  await prisma.reminder.createMany({
    data: [
      { userId, contactId: byName("Marcus").id, title: "Send proposal follow-up", type: "email", dueAt: new Date(now - 2 * DAY) },
      { userId, contactId: byName("Priya").id, title: "Call about homepage redesign", type: "call", dueAt: new Date(now - 1 * DAY) },
      { userId, contactId: byName("Ava").id, title: "Monthly retainer check-in", type: "meeting", dueAt: new Date(now + 1 * DAY) },
      { userId, contactId: byName("Lena").id, title: "Email Q3 quote", type: "email", dueAt: new Date(now + 2 * DAY) },
      { userId, contactId: byName("Sara").id, title: "Intro call", type: "call", dueAt: new Date(now + 4 * DAY) },
      { userId, contactId: byName("Tom").id, title: "Deliver final video cut", type: "task", dueAt: new Date(now + 6 * DAY) },
      { userId, contactId: byName("Ava").id, title: "Kickoff call (done)", type: "call", dueAt: new Date(now - 5 * DAY), completedAt: new Date(now - 5 * DAY) },
    ],
  });

  await prisma.interaction.createMany({
    data: [
      { userId, contactId: byName("Ava").id, type: "meeting", summary: "Reviewed brand refresh deliverables; approved phase 2.", occurredAt: new Date(now - 1 * DAY) },
      { userId, contactId: byName("Marcus").id, type: "email", summary: "Sent proposal v1 ($4.5k scope).", occurredAt: new Date(now - 3 * DAY) },
      { userId, contactId: byName("Tom").id, type: "call", summary: "Discussed shot list for promo video.", occurredAt: new Date(now - 4 * DAY) },
      { userId, contactId: byName("Priya").id, type: "note", summary: "Referred by a past client — warm lead.", occurredAt: new Date(now - 6 * DAY) },
    ],
  });

  // eslint-disable-next-line no-console
  console.log(
    `Seeded demo account: ${email} / demo1234 (${contacts.length} contacts, 7 reminders, 4 interactions)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
