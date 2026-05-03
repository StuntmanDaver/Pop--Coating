import { z } from "zod";

export const quoteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  projectDetails: z.string().min(1, "Project details are required"),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;
