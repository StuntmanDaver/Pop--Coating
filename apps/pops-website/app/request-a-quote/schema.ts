import { z } from "zod";

// Service options match the radio group on the live site's quote form
// (popsindustrial.com/request-a-quote/), preserving label spelling.
export const SERVICE_OPTIONS = [
  "Wet Paint Coating",
  "Complex Painting",
  "Abrasive Media Blasting",
  "Powder Coating",
  "Other",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

// Maps service-detail page slugs to the radio-group options on the quote form.
// "Large Capacity Powder Coating" has no dedicated option, so it preselects
// "Powder Coating" (closest fit; the buyer can elaborate in projectDetails).
export const SLUG_TO_SERVICE: Record<string, ServiceOption> = {
  "wet-paint-coatings": "Wet Paint Coating",
  "complex-coating": "Complex Painting",
  "abrasive-media-blasting": "Abrasive Media Blasting",
  "powder-coating": "Powder Coating",
  "large-capacity-powder-coating": "Powder Coating",
};

// Per-file size cap matches the live site's data-maxsize="10" (10 MB).
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Total payload cap (files only). Resend caps total email size at ~40 MB; staying well under.
export const MAX_TOTAL_FILES_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_COUNT = 5;

export const quoteSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phone: z.string().optional(),
    company: z.string().optional(),
    serviceRequested: z.enum(SERVICE_OPTIONS, {
      message: "Please select the service you need",
    }),
    otherService: z.string().optional(),
    projectDetails: z.string().min(1, "Project details are required"),
  })
  .superRefine((data, ctx) => {
    if (
      data.serviceRequested === "Other" &&
      (!data.otherService || data.otherService.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherService"],
        message: "Describe the other service you need",
      });
    }
  });

export type QuoteFormValues = z.infer<typeof quoteSchema>;
