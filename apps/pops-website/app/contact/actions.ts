"use server";

import { company } from "../../content/company";
import { buildEmailHtml, sendFormEmail } from "../../lib/email";
import { contactSchema, type ContactFormValues } from "./schema";

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; serverError: string }
  | { ok: false; fieldErrors: Partial<Record<keyof ContactFormValues, string[]>> };

export async function submitContact(data: ContactFormValues): Promise<SubmitContactResult> {
  const parsed = contactSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
      Record<keyof ContactFormValues, string[]>
    >;
    return { ok: false, fieldErrors };
  }

  const { name, email, message } = parsed.data;

  const html = buildEmailHtml("Contact Form Submission", [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Message", value: message },
  ]);

  try {
    await sendFormEmail({
      to: company.emails.info,
      subject: `Contact form from ${name}`,
      html,
      replyTo: email,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, serverError: `Failed to send your message. Please try calling us directly. (${message})` };
  }
}
