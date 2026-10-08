import { z } from "zod"

export const leadSchema = z.object({
  name: z.string().trim().min(2, { message: "Please enter your full name" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, {
      message: "Please enter a valid phone number",
    }),
})

export type LeadFormValues = z.infer<typeof leadSchema>
