import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface DraftInput {
  contact: {
    firstName: string;
    lastName: string;
    company: string | null;
    status: string;
    tags: string[];
    notes: string | null;
  };
  interactions: { type: string; summary: string }[];
  intent: string;
  tone: string;
  senderName: string;
}

// Lazily construct the client so the app boots fine with no API key set.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: config.ai.apiKey });
  return client;
}

const SYSTEM = `You are an expert CRM copywriter helping a freelancer or small-business owner write a short, effective follow-up email to one of their contacts.

Rules:
- Write in the requested tone.
- Keep the body under ~150 words: warm, specific, and easy to reply to.
- Ground the email in the provided context. Never invent facts (deals, dates, prices, commitments) that aren't supported by it.
- Sign off using the sender's name.
- Respond with ONLY a JSON object of the form {"subject": "...", "body": "..."} — no markdown, no code fences, no commentary. Use \\n for line breaks in the body.`;

function buildContext(input: DraftInput): string {
  const c = input.contact;
  return [
    `Sender (you): ${input.senderName}`,
    `Recipient: ${[c.firstName, c.lastName].filter(Boolean).join(" ")}`,
    c.company ? `Company: ${c.company}` : "",
    `Relationship stage: ${c.status}`,
    c.tags.length ? `Tags: ${c.tags.join(", ")}` : "",
    c.notes ? `Notes about them: ${c.notes}` : "",
    input.interactions.length
      ? `Recent interactions (newest first):\n${input.interactions
          .map((i) => `- ${i.type}: ${i.summary}`)
          .join("\n")}`
      : "No prior interactions logged.",
    "",
    `Tone: ${input.tone}`,
    `What this email should accomplish: ${input.intent}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Forgiving parse: strip any code fences, grab the first {...} block.
function parseDraft(text: string): EmailDraft | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]) as Partial<EmailDraft>;
    if (typeof obj.subject === "string" && typeof obj.body === "string") {
      return { subject: obj.subject, body: obj.body };
    }
  } catch {
    /* fall through to null */
  }
  return null;
}

function templateDraft(input: DraftInput): EmailDraft {
  const name = input.contact.firstName || "there";
  return {
    subject: "Following up",
    body: `Hi ${name},\n\n${input.intent}\n\nWould love to hear your thoughts whenever you have a moment.\n\nBest,\n${input.senderName}`,
  };
}

export async function generateFollowupEmail(
  input: DraftInput
): Promise<EmailDraft & { fallback: boolean }> {
  // No API key configured → return a labeled template so the UX is demoable.
  if (!config.ai.enabled) {
    return { ...templateDraft(input), fallback: true };
  }

  const response = await getClient().messages.create({
    model: config.ai.model,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: buildContext(input) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseDraft(text);
  if (!parsed) return { ...templateDraft(input), fallback: true };
  return { ...parsed, fallback: false };
}
