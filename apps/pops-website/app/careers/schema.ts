import { z } from "zod";

/** Roles applicants can select on the job application (multi-select). */
export const JOB_APPLICATION_POSITIONS = [
  "Supervisor",
  "Painter",
  "Blaster",
  "Powder Coating",
  "Loader",
  "Mechanic",
  "Shipping and Receiving",
  "Other",
] as const;

const positionSet = new Set(JOB_APPLICATION_POSITIONS as readonly string[]);

export const jobApplicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().max(40, "Phone is too long"),
  positionInterests: z
    .array(z.string())
    .min(1, "Select at least one position you're interested in")
    .superRefine((arr, ctx) => {
      for (const s of arr) {
        if (!positionSet.has(s)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid position selection",
          });
          return;
        }
      }
    }),
  message: z
    .string()
    .min(20, "Tell us about your experience and availability (at least 20 characters)"),
});

export type JobApplicationFormInput = z.input<typeof jobApplicationSchema>;
export type JobApplicationFormValues = z.infer<typeof jobApplicationSchema>;
