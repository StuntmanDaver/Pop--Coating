"use server";

import { company } from "../../content/company";
import { buildEmailHtml, sendFormEmail } from "../../lib/email";
import { quoteSchema, type QuoteFormValues } from "./schema";

export type SubmitQuoteResult =
  | { ok: true }
  | { ok: false; serverError: string }
  | { ok: false; fieldErrors: Partial<Record<keyof QuoteFormValues, string[]>> };

export async function submitQuote(data: QuoteFormValues): Promise<SubmitQuoteResult> {
  const parsed = quoteSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
      Record<keyof QuoteFormValues, string[]>
    >;
    return { ok: false, fieldErrors };
  }

  const { name, email, phone, company: companyName, projectDetails } = parsed.data;

  const html = buildEmailHtml("New Quote Request", [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    { label: "Company", value: companyName },
    { label: "Project Details", value: projectDetails },
  ]);

  try {
    await sendFormEmail({
      to: company.emails.info,
      subject: `New quote request from ${name}`,
      html,
      replyTo: email,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, serverError: `Failed to send your request. Please try calling us directly. (${message})` };
  }
}
