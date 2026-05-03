import { z } from "zod";

export const checkOutSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().min(1, "Phone is required"),
});

export type CheckOutFormValues = z.infer<typeof checkOutSchema>;
