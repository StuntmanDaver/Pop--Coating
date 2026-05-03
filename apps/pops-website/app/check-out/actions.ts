"use server";

import { company } from "../../content/company";
import { buildEmailHtml, sendFormEmail } from "../../lib/email";
import { checkOutSchema, type CheckOutFormValues } from "./schema";

export type SubmitCheckOutResult =
  | { ok: true }
  | { ok: false; serverError: string }
  | { ok: false; fieldErrors: Partial<Record<keyof CheckOutFormValues, string[]>> };

export async function submitCheckOut(data: CheckOutFormValues): Promise<SubmitCheckOutResult> {
  const parsed = checkOutSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
      Record<keyof CheckOutFormValues, string[]>
    >;
    return { ok: false, fieldErrors };
  }

  const { firstName, lastName, companyName, email, phone } = parsed.data;
  const fullName = `${firstName} ${lastName}`;

  const html = buildEmailHtml("Visitor Check-Out", [
    { label: "First Name", value: firstName },
    { label: "Last Name", value: lastName },
    { label: "Company", value: companyName },
    { label: "Email", value: email },
    { label: "Phone", value: phone },
  ]);

  try {
    await sendFormEmail({
      to: company.emails.info,
      subject: `Visitor check-out: ${fullName}${companyName ? ` from ${companyName}` : ""}`,
      html,
      replyTo: email,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, serverError: `Check-out could not be submitted. Please notify the front office directly. (${message})` };
  }
}
