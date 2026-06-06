import { config } from "../config.js";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

// Pluggable mailer. In local dev (no email provider configured) we log the
// message to the console so flows are testable without a real inbox. Swap this
// for Resend / SES / Postmark / SMTP in production by implementing `deliver`.
export async function sendMail(msg: MailMessage): Promise<void> {
  if (!config.email.enabled) {
    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "📧 [DEV MAILER] Email not sent (no provider configured).",
        `   To:      ${msg.to}`,
        `   Subject: ${msg.subject}`,
        "   ----------------------------------------",
        msg.text
          .split("\n")
          .map((l) => `   ${l}`)
          .join("\n"),
        "   ----------------------------------------",
        "",
      ].join("\n")
    );
    return;
  }
  // TODO: integrate real provider, e.g.:
  //   await resend.emails.send({ from: config.email.from, to: msg.to, ... })
  throw new Error("Email provider enabled but no delivery implementation configured.");
}
