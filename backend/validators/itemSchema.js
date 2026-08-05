// // validation/itemSchema.js
// import { z } from "zod";
// const HSN_REGEX = /^\d{4,8}$/;
// const itemFormSchema = z.object({
//   Item_Name: z.string().min(1, "Item Name is required"),
//   // Item_HSN: z
//   //   .string()
//   //   .min(1, "HSN Code is required")
//   //   .max(20, "HSN Code must be at most 20 characters"),
//   Item_HSN: z.string()
//       // 1. Enforce length (4 to 8 characters)
//       .min(4, "HSN Code must be at least 4 digits.")
//       .max(8, "HSN Code must be at most 8 digits.")
//       // 2. Enforce only digits (0-9)
//       .regex(HSN_REGEX, "HSN Code must contain only digits (0-9)."),
//   Item_Unit: z.string().min(1, "Unit is required"),
//   //Item_Image: z.string().optional().nullable(),
//   Item_Category: z.string().min(1, "At least one category is required"),
// });

// export default itemFormSchema;

import { z } from "zod";

const HSN_REGEX = /^\d{4,8}$/;
const digitsOnly = (fieldName) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => String(val ?? "").trim())
    .refine(
      (val) => val === "" || /^\d+(\.\d{1,2})?$/.test(val),
      {
        message: `${fieldName} must be a valid number`,
      }
    )
    .transform((val) =>
      val === "" ? null : Number(val)
    );
const decimalNumber = (fieldName, decimals = 6) =>
  z
    .union([
      z.string(),
      z.number(),
      z.null(),
      z.undefined(),
    ])
    .transform((val) => String(val ?? "").trim())
    .refine(
      (val) =>
        val === "" ||
        new RegExp(
          `^\\d+(\\.\\d{1,${decimals}})?$`
        ).test(val),
      {
        message: `${fieldName} must be a valid number`,
      }
    )
    .transform((val) =>
      val === "" ? null : Number(val)
    );
 const itemFormSchema = z
  .object({
    Item_Name: z
      .string()
      .trim()
      .min(1, "Item Name is required"),

    // Item_Category: z
    //   .string()
    //   .trim()
    //   .min(1, "Category is required"),
        Item_Category: z
      .union([
        z.string(),
        z.null(),
        z.undefined(),
      ])
      .transform((val) => {
       
    
        const value = val.trim();
    
        return value === "" ? "" : value;
      }),

    Item_HSN: z
          .union([z.string(), z.number(), z.undefined(), z.null()])
          .transform((val) => (val === undefined || val === null ? "" : String(val).trim()))
          .refine((val) => val === "" || /^\d{4,8}$/.test(val), {
            message: "HSN Code must be 4-8 digits if provided",
          }),
Item_Unit: z
  .string()
  .trim()
  .optional()
  .default(""),
    // =====================================================
    // UNITS
    // =====================================================

    Primary_Unit: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val || null),

    Secondary_Unit: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val || null),

    Conversion_Rate:decimalNumber("Conversion Rate", 6),

    // =====================================================
    // PRICING
    // =====================================================

    // Sale_Price: digitsOnly("Sale Price")
    //   .optional()
    //   .default(null),

    // Purchase_Price: digitsOnly("Purchase Price")
    //   .optional()
    //   .default(null),

    // Wholesale_Price: digitsOnly("Wholesale Price")
    //   .optional()
    //   .default(null),

    // Tax_Type: z
    //   .string()
    //   .optional()
    //   .default("None"),

    // =====================================================
    // STOCK
    // All optional → empty becomes NULL
    // =====================================================

    Opening_Quantity:digitsOnly("Opening Quantity"),

    At_Price:digitsOnly("At Price"),

    As_Of_Date: z
      .union([
        z.string(),
        z.null(),
        z.undefined(),
      ])
      .transform((val) => {
        if (!val?.trim()) {
          return null;
        }

        return val.trim();
      }),

     Min_Stock:digitsOnly("Min Stock To Maintain"),

    Location: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val || null),
  })

  // =======================================================
  // UNIT RELATIONSHIP VALIDATION
  // =======================================================

  .superRefine((data, ctx) => {
    // Secondary cannot exist without Primary
    if (
      data.Secondary_Unit &&
      !data.Primary_Unit
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["Secondary_Unit"],
        message:
          "Select a primary unit before selecting a secondary unit.",
      });
    }

    // Primary and Secondary cannot be same
    if (
      data.Primary_Unit &&
      data.Secondary_Unit &&
      data.Primary_Unit === data.Secondary_Unit
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["Secondary_Unit"],
        message:
          "Primary and secondary units cannot be the same.",
      });
    }

    // Secondary requires conversion
    if (
      data.Secondary_Unit &&
      !(
        Number(data.Conversion_Rate) > 0
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["Conversion_Rate"],
        message:
          "Conversion rate is required when a secondary unit is selected.",
      });
    }

    // No secondary → conversion should not exist
    // if (
    //   !data.Secondary_Unit &&
    //   data.Conversion_Rate !== null &&
    //   data.Conversion_Rate !== undefined
    // ) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     path: ["Conversion_Rate"],
    //     message:
    //       "Conversion rate requires a secondary unit.",
    //   });
    // }
  });

  export default itemFormSchema;