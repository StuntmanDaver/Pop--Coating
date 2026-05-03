import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

export type FormEmailParams = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM ?? "noreply@popsindustrial.com";
}

export async function sendFormEmail({ to, subject, html, replyTo }: FormEmailParams) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    Sentry.captureException(error, {
      extra: { to, subject },
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export type FormField = {
  label: string;
  value: string | undefined;
};

export function buildEmailHtml(title: string, fields: FormField[]): string {
  const rows = fields
    .filter((f) => f.value != null && f.value !== "")
    .map(
      (f) => `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #555; white-space: nowrap; vertical-align: top; border-bottom: 1px solid #eee;">
          ${escapeHtml(f.label)}
        </td>
        <td style="padding: 8px 12px; color: #222; vertical-align: top; border-bottom: 1px solid #eee;">
          ${escapeHtml(f.value ?? "")}
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title></head>
<body style="font-family: sans-serif; font-size: 14px; color: #222; background: #f9f9f9; margin: 0; padding: 24px;">
  <table style="max-width: 600px; width: 100%; margin: 0 auto; background: #fff; border-radius: 4px; border: 1px solid #ddd; border-collapse: collapse;">
    <thead>
      <tr>
        <th colspan="2" style="padding: 16px; background: #1a1a1a; color: #f5c400; text-align: left; font-size: 16px; border-radius: 4px 4px 0 0;">
          ${escapeHtml(title)}
        </th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">
    Sent via Pop&rsquo;s Industrial Coatings website
  </p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
