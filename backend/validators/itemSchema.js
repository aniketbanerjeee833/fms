// // // validation/itemSchema.js
// // import { z } from "zod";
// // const HSN_REGEX = /^\d{4,8}$/;


// // export default itemFormSchema;

// import { z } from "zod";

// const HSN_REGEX = /^\d{4,8}$/;
// const digitsOnly = (fieldName) =>
//   z
//     .union([z.string(), z.number(), z.null(), z.undefined()])
//     .transform((val) => String(val ?? "").trim())
//     .refine(
//       (val) => val === "" || /^\d+(\.\d{1,2})?$/.test(val),
//       {
//         message: `${fieldName} must be a valid number`,
//       }
//     )
//     .transform((val) =>
//       val === "" ? null : Number(val)
//     );
//     const priceField = (fieldName) =>
//       z
//         .union([z.string(), z.number(), z.null(), z.undefined()])
//         .transform((val) => String(val ?? "").trim())
//         .refine(
//           (val) => val === "" || /^\d+(\.\d{1,2})?$/.test(val),
//           { message: `${fieldName} must be a valid number` }
//         )
//         .transform((val) => (val === "" ? null : Number(val)));
// const decimalNumber = (fieldName, decimals = 6) =>
//   z
//     .union([
//       z.string(),
//       z.number(),
//       z.null(),
//       z.undefined(),
//     ])
//     .transform((val) => String(val ?? "").trim())
//     .refine(
//       (val) =>
//         val === "" ||
//         new RegExp(
//           `^\\d+(\\.\\d{1,${decimals}})?$`
//         ).test(val),
//       {
//         message: `${fieldName} must be a valid number`,
//       }
//     )
//     .transform((val) =>
//       val === "" ? null : Number(val)
//     );
//  const itemFormSchema = z
//   .object({
//     Item_Name: z
//       .string()
//       .trim()
//       .min(1, "Item Name is required"),

//      Item_Type: z
//       .enum(["Product", "Service"])
//       .optional()
//       .default("Product"),
      
//         Item_Category: z
//       .union([
//         z.string(),
//         z.null(),
//         z.undefined(),
//       ])
//       .transform((val) => {
       
    
//          const value = String(val ?? "").trim();
    
//         return value === "" ? "" : value;
//       }),

//     Item_HSN: z
//           .union([z.string(), z.number(), z.undefined(), z.null()])
//           .transform((val) => (val === undefined || val === null ? "" : String(val).trim()))
//           .refine((val) => val === "" || /^\d{4,8}$/.test(val), {
//             message: "HSN Code must be 4-8 digits if provided",
//           }),
// Item_Unit: z
//   .string()
//   .trim()
//   .nullable()
//   .optional()
//   .default(""),
//     // =====================================================
//     // UNITS
//     // =====================================================

//     Primary_Unit: z
//       .string()
//       .trim()
//       .nullable()
//       .optional()
//       .transform((val) => val || null),

//     Secondary_Unit: z
//       .string()
//       .trim()
//       .nullable()
//       .optional()
//       .transform((val) => val || null),

//     Conversion_Rate:decimalNumber("Conversion Rate", 6),
//     Item_Code: z
//           .string()
//           .trim()
//           .nullable()
//           .optional()
//           .transform((val) => val || null),
    
//         MRP: priceField("MRP"),
    
//         Discount_On_MRP_For_Sale: priceField("Discount on MRP For Sale"),
//       Sale_Price: priceField("Sale Price"),
    
//         Sale_Price_Type: z
//           .enum(["With_Tax", "Without_Tax"])
//           .optional()
//           .default("Without_Tax"),
    
//         Discount_On_Sale_Price: priceField("Discount on Sale Price"),
    
//         Discount_Type_On_Sale_Price: z
//           .enum(["Percentage", "Amount"])
//           .optional()
//           .default("Percentage"),
    
//        Purchase_Price: priceField("Purchase Price"),
    
//         Purchase_Price_Type: z
//           .enum(["With_Tax", "Without_Tax"])
//           .optional()
//           .default("Without_Tax"),
    
    

//     // =====================================================
//     // PRICING
//     // =====================================================

//     // Sale_Price: digitsOnly("Sale Price")
//     //   .optional()
//     //   .default(null),

//     // Purchase_Price: digitsOnly("Purchase Price")
//     //   .optional()
//     //   .default(null),

//     // Wholesale_Price: digitsOnly("Wholesale Price")
//     //   .optional()
//     //   .default(null),

//     // Tax_Type: z
//     //   .string()
//     //   .optional()
//     //   .default("None"),

//     // =====================================================
//     // STOCK
//     // All optional → empty becomes NULL
//     // =====================================================

//     Opening_Quantity:digitsOnly("Opening Quantity"),

//     At_Price:digitsOnly("At Price"),

//     As_Of_Date: z
//       .union([
//         z.string(),
//         z.null(),
//         z.undefined(),
//       ])
//       .transform((val) => {
//         if (!val?.trim()) {
//           return null;
//         }

//         return val.trim();
//       }),

//      Min_Stock:digitsOnly("Min Stock To Maintain"),

//     Location: z
//       .string()
//       .trim()
//       .nullable()
//       .optional()
//       .transform((val) => val || null),
//   })

//   // =======================================================
//   // UNIT RELATIONSHIP VALIDATION
//   // =======================================================

//   .superRefine((data, ctx) => {
//        if (data.Discount_On_Sale_Price && !data.Sale_Price) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ["Discount_On_Sale_Price"],
//             message: "Enter a Sale Price before adding a discount.",
//           });
//         }
//     // Secondary cannot exist without Primary
//     if (
//       data.Secondary_Unit &&
//       !data.Primary_Unit
//     ) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ["Secondary_Unit"],
//         message:
//           "Select a primary unit before selecting a secondary unit.",
//       });
//     }

//     // Primary and Secondary cannot be same
//     if (
//       data.Primary_Unit &&
//       data.Secondary_Unit &&
//       data.Primary_Unit === data.Secondary_Unit
//     ) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ["Secondary_Unit"],
//         message:
//           "Primary and secondary units cannot be the same.",
//       });
//     }

//     // Secondary requires conversion
//     if (
//       data.Secondary_Unit &&
//       !(
//         Number(data.Conversion_Rate) > 0
//       )
//     ) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ["Conversion_Rate"],
//         message:
//           "Conversion rate is required when a secondary unit is selected.",
//       });
//     }

//     // No secondary → conversion should not exist
//     // if (
//     //   !data.Secondary_Unit &&
//     //   data.Conversion_Rate !== null &&
//     //   data.Conversion_Rate !== undefined
//     // ) {
//     //   ctx.addIssue({
//     //     code: z.ZodIssueCode.custom,
//     //     path: ["Conversion_Rate"],
//     //     message:
//     //       "Conversion rate requires a secondary unit.",
//     //   });
//     // }
//   });

//   export default itemFormSchema;

// validation/itemSchema.js

import { z } from "zod";

const HSN_REGEX = /^\d{4,8}$/;

// =====================================================
// NUMBER HELPERS
// =====================================================

const digitsOnly = (fieldName) =>
  z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
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

const priceField = (fieldName) =>
  z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
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
    .union([z.string(), z.number()])
    .nullable()
    .optional()
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

// =====================================================
// ITEM SCHEMA
// =====================================================

const itemFormSchema = z
  .object({
    // =====================================================
    // BASIC
    // =====================================================

    Item_Name: z
      .string()
      .trim()
      .min(1, "Item Name is required"),

    Item_Type: z
      .enum(["Product", "Service"])
      .optional()
      .default("Product"),

    Item_Category: z
      .string()
      .nullable()
      .optional()
      .transform((val) => {
        const value = String(val ?? "").trim();

        return value === "" ? "" : value;
      }),

    Item_HSN: z
      .union([z.string(), z.number()])
      .nullable()
      .optional()
      .transform((val) =>
        val === undefined || val === null
          ? ""
          : String(val).trim()
      )
      .refine(
        (val) =>
          val === "" || HSN_REGEX.test(val),
        {
          message:
            "HSN Code must be 4-8 digits if provided",
        }
      ),

    Item_Unit: z
      .string()
      .trim()
      .nullable()
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

    Conversion_Rate: decimalNumber(
      "Conversion Rate",
      6
    ),

    // =====================================================
    // ITEM CODE
    // =====================================================

    Item_Code: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val || null),

    // =====================================================
    // PRICING
    // =====================================================

    MRP: priceField("MRP"),

    Discount_On_MRP_For_Sale: priceField(
      "Discount on MRP For Sale"
    ),

    Sale_Price: priceField("Sale Price"),

    Sale_Price_Type: z
      .enum(["With_Tax", "Without_Tax"])
      .optional()
      .default("Without_Tax"),

    Discount_On_Sale_Price: priceField(
      "Discount on Sale Price"
    ),

    Discount_Type_On_Sale_Price: z
      .enum(["Percentage", "Amount"])
      .optional()
      .default("Percentage"),

    Purchase_Price: priceField(
      "Purchase Price"
    ),

    Purchase_Price_Type: z
      .enum(["With_Tax", "Without_Tax"])
      .optional()
      .default("Without_Tax"),

    // =====================================================
    // STOCK
    // =====================================================

    Opening_Quantity: digitsOnly(
      "Opening Quantity"
    ),

    At_Price: digitsOnly("At Price"),

    As_Of_Date: z
      .string()
      .nullable()
      .optional()
      .transform((val) => {
        if (!val?.trim()) {
          return null;
        }

        return val.trim();
      }),

    Min_Stock: digitsOnly(
      "Min Stock To Maintain"
    ),

    Location: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val || null),
  })

  // =====================================================
  // CROSS-FIELD VALIDATION
  // =====================================================

  .superRefine((data, ctx) => {
    // -----------------------------------------------------
    // Discount requires Sale Price
    // -----------------------------------------------------

    if (
      data.Discount_On_Sale_Price &&
      !data.Sale_Price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["Discount_On_Sale_Price"],
        message:
          "Enter a Sale Price before adding a discount.",
      });
    }

    // -----------------------------------------------------
    // Secondary Unit requires Primary Unit
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // Primary and Secondary cannot be same
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // Secondary Unit requires Conversion Rate
    // -----------------------------------------------------

    if (
      data.Secondary_Unit &&
      !(Number(data.Conversion_Rate) > 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["Conversion_Rate"],
        message:
          "Conversion rate is required when a secondary unit is selected.",
      });
    }

    // -----------------------------------------------------
    // No secondary → conversion can remain NULL
    // -----------------------------------------------------
  });

export default itemFormSchema;