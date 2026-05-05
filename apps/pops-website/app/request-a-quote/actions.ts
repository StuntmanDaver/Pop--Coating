"use server";

import { company } from "../../content/company";
import {
  buildEmailHtml,
  sendFormEmail,
  type EmailAttachment,
} from "../../lib/email";
import { verifyRecaptcha } from "../../lib/recaptcha";
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  MAX_TOTAL_FILES_BYTES,
  quoteSchema,
  type QuoteFormValues,
} from "./schema";

export type SubmitQuoteResult =
  | { ok: true }
  | { ok: false; serverError: string }
  | { ok: false; fieldErrors: Partial<Record<keyof QuoteFormValues, string[]>> };

export async function submitQuote(
  formData: FormData,
): Promise<SubmitQuoteResult> {
  const recaptchaToken = String(formData.get("recaptchaToken") ?? "");

  const rawFields: Record<string, string | undefined> = {
    name: optionalString(formData.get("name")),
    email: optionalString(formData.get("email")),
    phone: optionalString(formData.get("phone")),
    company: optionalString(formData.get("company")),
    serviceRequested: optionalString(formData.get("serviceRequested")),
    otherService: optionalString(formData.get("otherService")),
    projectDetails: optionalString(formData.get("projectDetails")),
  };

  const parsed = quoteSchema.safeParse(rawFields);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
      Record<keyof QuoteFormValues, string[]>
    >;
    return { ok: false, fieldErrors };
  }

  const filesResult = await collectAttachments(formData);
  if (!filesResult.ok) {
    return { ok: false, serverError: filesResult.error };
  }

  try {
    const recaptcha = await verifyRecaptcha(recaptchaToken);
    if (!recaptcha.success) {
      return {
        ok: false,
        serverError: "reCAPTCHA verification failed. Please try again.",
      };
    }
  } catch (err) {
    return {
      ok: false,
      serverError: `reCAPTCHA error: ${err instanceof Error ? err.message : "Unknown"}`,
    };
  }

  const {
    name,
    email,
    phone,
    company: companyName,
    serviceRequested,
    otherService,
    projectDetails,
  } = parsed.data;

  const html = buildEmailHtml("New Quote Request", [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    { label: "Company", value: companyName },
    { label: "Service Requested", value: serviceRequested },
    ...(serviceRequested === "Other"
      ? [{ label: "Other Service", value: otherService }]
      : []),
    { label: "Project Details", value: projectDetails },
    ...(filesResult.attachments.length > 0
      ? [
          {
            label: "Attachments",
            value: filesResult.attachments
              .map((a) => `${a.filename} (${humanizeBytes(a.content.length)})`)
              .join(", "),
          },
        ]
      : []),
  ]);

  try {
    await sendFormEmail({
      to: company.emails.info,
      subject: `New quote request from ${name}`,
      html,
      replyTo: email,
      attachments: filesResult.attachments,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      ok: false,
      serverError: `Failed to send your request. Please try calling us directly. (${message})`,
    };
  }
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

type AttachmentResult =
  | { ok: true; attachments: EmailAttachment[] }
  | { ok: false; error: string };

async function collectAttachments(
  formData: FormData,
): Promise<AttachmentResult> {
  const entries = formData.getAll("attachments");
  const files = entries.filter(
    (e): e is File => e instanceof File && e.size > 0,
  );

  if (files.length === 0) {
    return { ok: true, attachments: [] };
  }

  if (files.length > MAX_FILE_COUNT) {
    return {
      ok: false,
      error: `Too many files attached. The limit is ${MAX_FILE_COUNT}.`,
    };
  }

  let total = 0;
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        error: `${file.name} is larger than ${humanizeBytes(MAX_FILE_BYTES)}. Please attach a smaller file or email us directly at ${company.emails.info}.`,
      };
    }
    total += file.size;
  }

  if (total > MAX_TOTAL_FILES_BYTES) {
    return {
      ok: false,
      error: `Combined attachments exceed ${humanizeBytes(MAX_TOTAL_FILES_BYTES)}. Please send larger files via email to ${company.emails.info}.`,
    };
  }

  const attachments: EmailAttachment[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: file.name,
      content: buffer,
      contentType: file.type || undefined,
    });
  }

  return { ok: true, attachments };
}

function humanizeBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
