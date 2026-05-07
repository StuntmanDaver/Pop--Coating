"use server";

import { company } from "../../content/company";
import {
  buildEmailHtml,
  sendFormEmail,
  type EmailAttachment,
} from "../../lib/email";
import { verifyRecaptcha } from "../../lib/recaptcha";
import {
  jobApplicationSchema,
  type JobApplicationFormValues,
} from "./schema";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type SubmitJobApplicationResult =
  | { ok: true }
  | { ok: false; serverError: string }
  | { ok: false; fieldErrors: Partial<Record<keyof JobApplicationFormValues, string[]>> };

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function humanizeBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateResumeMeta(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) {
    return { ok: false, error: "Please attach your resume (PDF or Word)." };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return {
      ok: false,
      error: `Resume must be ${humanizeBytes(MAX_RESUME_BYTES)} or smaller.`,
    };
  }
  const nameLower = file.name.toLowerCase();
  const extOk =
    nameLower.endsWith(".pdf") ||
    nameLower.endsWith(".doc") ||
    nameLower.endsWith(".docx");
  const typeOk = file.type === "" || ALLOWED_RESUME_TYPES.has(file.type);
  if (!extOk && !typeOk) {
    return {
      ok: false,
      error: "Resume must be a PDF or Word document (.pdf, .doc, .docx).",
    };
  }
  return { ok: true };
}

export async function submitJobApplication(
  formData: FormData,
  recaptchaToken: string,
): Promise<SubmitJobApplicationResult> {
  const rawFields = {
    name: optionalString(formData.get("name")),
    email: optionalString(formData.get("email")),
    phone: (optionalString(formData.get("phone")) ?? "").trim(),
    message: optionalString(formData.get("message")),
    positionInterests: formData
      .getAll("positionInterests")
      .filter((v): v is string => typeof v === "string" && v.length > 0),
  };

  const parsed = jobApplicationSchema.safeParse(rawFields);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
      Record<keyof JobApplicationFormValues, string[]>
    >;
    return { ok: false, fieldErrors };
  }

  const resumeEntry = formData.get("resume");
  if (!(resumeEntry instanceof File)) {
    return { ok: false, serverError: "Please attach your resume (PDF or Word)." };
  }

  const meta = validateResumeMeta(resumeEntry);
  if (!meta.ok) {
    return { ok: false, serverError: meta.error };
  }

  let attachment: EmailAttachment;
  try {
    const buffer = Buffer.from(await resumeEntry.arrayBuffer());
    attachment = {
      filename: resumeEntry.name,
      content: buffer,
      contentType: resumeEntry.type || undefined,
    };
  } catch {
    return { ok: false, serverError: "Could not read the resume file. Please try again." };
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

  const { name, email, phone, positionInterests, message } = parsed.data;

  const positionsLine = positionInterests.join("; ");
  const phoneTrimmed = phone.trim();

  const html = buildEmailHtml("Job application", [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Phone", value: phoneTrimmed === "" ? undefined : phoneTrimmed },
    { label: "Position(s)", value: positionsLine },
    { label: "Experience & availability", value: message },
    { label: "Resume", value: resumeEntry.name },
  ]);

  try {
    await sendFormEmail({
      to: company.emails.formSubmissions,
      subject: `Job application from ${name}`,
      html,
      replyTo: email,
      attachments: [attachment],
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
