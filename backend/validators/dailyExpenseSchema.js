
import { z } from "zod";

export const dailyExpenseSchema=z.object({
        Date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Date must be a valid date",
      }),
        
    Purpose: z.string().trim().min(1, "Purpose is required"),
  Amount: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine(
      (val) => /^\d+(\.\d{1,2})?$/.test(val),
      { message: "Amount must be greater than 0" }
    )
    .transform((val) => Number(val))
    .refine(
      (num) => num >= 1,
      { message: "Amount must be greater than 0" }
    ),
  

    Payment_Method: z.string().trim().min(1, "Payment Method is required"),
    Paid_Via: z.string().trim().min(1, "Paid via is required"),
})