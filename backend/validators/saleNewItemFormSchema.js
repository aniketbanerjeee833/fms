import { z } from "zod";




const HSN_REGEX = /^\d{4,8}$/;
// const digitsOnly = (fieldName, required = true) =>
//   z.union([z.string(), z.number()])  // allow both
//     .refine(
//       (val) => {
//         const strVal = String(val);
//         if (!strVal) return !required;
//         return /^\d+(\.\d{1,2})?$/.test(strVal);
//       },
//       { message: `${fieldName} is required and should be a number` }
//     )
//     .transform((val) => Number(val)); // ✅ always store as number
const digitsOnly = (fieldName, required = true) =>
  z.union([z.string(), z.number()])
    .transform((val) => String(val ?? "").trim())
    .refine(
      (val) => (required ? val !== "" : true),
      { message: `${fieldName} is required` }
    )
    .refine(
      (val) => val === "" || /^\d+(\.\d{1,2})?$/.test(val),
      { message: `${fieldName} must be a valid number` }
    )
    .transform((val) => (val === "" ? 0 : Number(val)));
// ✅ Schema
export const saleNewItemFormSchema = z.object({
  Party_Name: z.string().min(1, "Party_Name is required"),
      // GSTIN: z
      // .string()
      // .trim()
      // .refine(val => val.length === 15, {
      //   message: "GSTIN must be exactly 15 characters"
      // }),
    // GSTIN: z.string().min(15, "GSTIN must be at least 15 characters")
    //     .max(15, "GSTIN must be at most 15 characters"),
GSTIN: z
  .string({
    required_error: "GSTIN is required",
    invalid_type_error: "GSTIN must be a string",
  })
  .length(15, "GSTIN must be exactly 15 characters"),

  Invoice_Number: z.string().min(1, "Invoice_Number is required"),

  Invoice_Date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invoice_Date must be a valid date",
    }),

  State_Of_Supply: z.string().min(1, "State_Of_Supply is required"),

  // 🔹 Auto-calculated but cannot be empty
  Total_Amount: digitsOnly("Total_Amount", true),
  Balance_Due: digitsOnly("Balance_Due", true),

  // 🔹 Optional but digits if provided
  Total_Received: z.string().optional().or(digitsOnly("Total_Received", false)),
  Payment_Type: z
      .enum(["Cash", "Cheque", "Neft"])
      .or(z.literal("")) // allow blank select
      .refine((val) => val !== "", {
        message: "Please select a payment type.",
      }),
  // Payment_Type: z.enum(["Cash", "Cheque", "Neft"]).default("Cash"),
  Reference_Number: z
  .string()
  .trim()
  .optional()
  .or(z.literal("")),

  // Stock_Quantity: digitsOnly("Stock_Quantity"),

  items: z
    .array(
      z.object({
           Item_Category: z.string().min(1, "Item category is required"),
        Item_Name: z.string().min(1, "Item name is required"),
  
            // Item_HSN: z.string()
            //      // 1. Enforce length (4 to 8 characters)
            //      .min(4, "HSN Code must be at least 4 digits.")
            //      .max(8, "HSN Code must be at most 8 digits.")
            //      // 2. Enforce only digits (0-9)
            //      .regex(HSN_REGEX, "HSN Code must contain only digits (0-9)."),
            //       Item_Image: z.string().optional(),
                      Item_HSN: z
                          .union([
                            z.string(),
                            z.number(),
                            z.undefined(),
                            z.null(),
                          ])
                          .transform((val) => (val === undefined || val === null ? "" : String(val))) // ✅ Always a string
                          .refine((val) => val.trim() !== "", { message: "HSN Code is required." })
                          .refine((val) => /^\d+$/.test(val), { message: "HSN Code must contain only digits (0-9)." })
                          .refine((val) => val.length >= 4, { message: "HSN Code must be at least 4 digits." })
                          .refine((val) => val.length <= 8, { message: "HSN Code must be at most 8 digits." }),
     Quantity: z.preprocess(
      (val) => Number(val),
      z.number().min(1, "Quantity must be greater than zero")
    ),
// 
// Quantity:z.union([z.string(), z.number()])  // allow both
//     .refine(
//       (val) => {
//         const strVal = String(val);
//         if (!strVal) return false;
//         return /^\d+(\.\d{1,2})?$/.test(strVal);
//       },
//       { message: "Quantity is required and should be a number" }
//     )
//     .transform((val) => Number(val)).min(1, "Quantity must be greater than zero"),
  
        Item_Unit: z.string().min(1, "Unit is required"),
        //        Sale_Price: digitsOnly("Sale_Price", true).refine(
        //   (num) => num >= 1,
        //   { message: "Sale Price must be  greater than 0" }
        // ),
                Sale_Price: z
          .number()
          .min(1, "Sale Price must be greater than 0"),
        // Sale_Price: digitsOnly("Sale_Price", false),
        // Purchase_Price_Type: z.enum(["With Tax", "Without Tax"]),
        Discount_On_Sale_Price: digitsOnly("Discount_On_Sale_Price", false).optional(),
        Discount_Type_On_Sale_Price: z.enum(["Percentage", "Amount"]).optional(),
        Tax_Type: z.string().min(1, "Tax_Type is required").default("None"), // ✅ no need to validate enum, UI ensures correctness
        Tax_Amount: digitsOnly("Tax_Amount", false),
        Amount: digitsOnly("Amount", false),
      })
    )
    .nonempty("At least one item must be added"),
});
