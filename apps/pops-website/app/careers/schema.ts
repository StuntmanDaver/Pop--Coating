import { z } from "zod";

export const jobApplicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .transform((s) => s.trim())
    .transform((s) => (s.length === 0 ? undefined : s)),
  position: z
    .string()
    .min(1, "Please enter the role or type of work you're interested in")
    .max(200),
  message: z
    .string()
    .min(20, "Tell us about your experience and availability (at least 20 characters)"),
});

export type JobApplicationFormValues = z.infer<typeof jobApplicationSchema>;
