"use server";

import { company } from "../../content/company";
import { buildEmailHtml, sendFormEmail } from "../../lib/email";
import { verifyRecaptcha } from "../../lib/recaptcha";
import { checkInSchema, type CheckInFormValues } from "./schema";

export type SubmitCheckInResult =
  | { ok: true }
  | { ok: false; serverError: string }
  | { ok: false; fieldErrors: Partial<Record<keyof CheckInFormValues, string[]>> };

export async function submitCheckIn(
  data: CheckInFormValues,
  recaptchaToken: string,
): Promise<SubmitCheckInResult> {
  const parsed = checkInSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
      Record<keyof CheckInFormValues, string[]>
    >;
    return { ok: false, fieldErrors };
  }

  try {
    const recaptcha = await verifyRecaptcha(recaptchaToken);
    if (!recaptcha.success) {
      return { ok: false, serverError: "reCAPTCHA verification failed. Please try again." };
    }
  } catch (err) {
    return { ok: false, serverError: `reCAPTCHA error: ${err instanceof Error ? err.message : "Unknown"}` };
  }

  const { firstName, lastName, companyName, email, phone, reason } = parsed.data;
  const fullName = `${firstName} ${lastName}`;

  const html = buildEmailHtml("Visitor Check-In", [
    { label: "First Name", value: firstName },
    { label: "Last Name", value: lastName },
    { label: "Company", value: companyName },
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    { label: "Reason for Visit", value: reason },
    { label: "Safety Rules Acknowledged", value: "Yes" },
  ]);

  try {
    await sendFormEmail({
      to: company.emails.info,
      subject: `Visitor check-in: ${fullName}${companyName ? ` from ${companyName}` : ""}`,
      html,
      replyTo: email,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, serverError: `Check-in could not be submitted. Please notify the front office directly. (${message})` };
  }
}
