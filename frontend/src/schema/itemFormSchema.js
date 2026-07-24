import { z } from "zod";


const HSN_REGEX = /^\d{4,8}$/;
export const itemFormSchema = z.object({
  Item_Name: z.string().min(1, "Item Name is required"),

//   Item_Code: z.string().optional().nullable(),

//   Item_HSN: z
//     .string()
//     .max(20, "HSN Code must be at most 20 characters")
//     .optional()
//     .nullable(),
Item_HSN: z.string()
    // 1. Enforce length (4 to 8 characters)
    .min(4, "HSN Code must be at least 4 digits.")
    .max(8, "HSN Code must be at most 8 digits.")
    // 2. Enforce only digits (0-9)
    .regex(HSN_REGEX, "HSN Code must contain only digits (0-9)."),
//  Item_HSN: z
//     .string()
//     .min(1, "HSN Code is required")
//     .max(20, "HSN Code must be at most 20 characters"),
 Item_Unit: z.string().min(1, "Unit is required"),
  Item_Image: z.string().optional().nullable(),
  Item_Category: z
    .string()
    .min(1, "At least one category is required"),


});
