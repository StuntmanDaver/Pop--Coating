"use server";

import { company } from "../../content/company";
import { buildEmailHtml, sendFormEmail } from "../../lib/email";
import { verifyRecaptcha } from "../../lib/recaptcha";
import { jobApplicationSchema, type JobApplicationFormValues } from "./schema";

export type SubmitJobApplicationResult =
  | { ok: true }
  | { ok: false; serverError: string }
  | { ok: false; fieldErrors: Partial<Record<keyof JobApplicationFormValues, string[]>> };

export async function submitJobApplication(
  data: JobApplicationFormValues,
  recaptchaToken: string,
): Promise<SubmitJobApplicationResult> {
  const parsed = jobApplicationSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
      Record<keyof JobApplicationFormValues, string[]>
    >;
    return { ok: false, fieldErrors };
  }

  try {
    const recaptcha = await verifyRecaptcha(recaptchaToken);
    if (!recaptcha.success) {
      return { ok: false, serverError: "reCAPTCHA verification failed. Please try again." };
    }
  } catch (err) {
    return {
      ok: false,
      serverError: `reCAPTCHA error: ${err instanceof Error ? err.message : "Unknown"}`,
    };
  }

  const { name, email, phone, position, message } = parsed.data;

  const html = buildEmailHtml("Job application", [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    { label: "Position / interest", value: position },
    { label: "Message", value: message },
  ]);

  try {
    await sendFormEmail({
      to: company.emails.info,
      subject: `Job application from ${name} — ${position}`,
      html,
      replyTo: email,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      ok: false,
      serverError: `Failed to send your application. Please try calling us directly. (${msg})`,
    };
  }
}
