
import { z } from "zod";
const HSN_REGEX = /^\d{4,8}$/;
// ✅ Digits only helper

// const digitsOnly = (fieldName, required = true) =>
//   z.union([z.string(), z.number()])
//     .transform((val) => String(val ?? "").trim())
//     .refine(
//       (val) => (required ? val !== "" : true),
//       { message: `${fieldName} is required` }
//     )
//     .refine(
//       (val) => val === "" || /^\d+(\.\d{1,2})?$/.test(val),
//       { message: `${fieldName} must be a valid number` }
//     )
//     .transform((val) => (val === "" ? 0 : Number(val)));
const digitsOnly = (fieldName, required = true) =>
  z.union([z.string(), z.number()])
    .transform((val) => String(val ?? "").trim())
    .refine(
      (val) => (required ? val !== "" : true),
      { message: `${fieldName} is required` }
    )
    .refine(
      (val) => val === "" || /^-?\d+(\.\d{1,2})?$/.test(val),   // ← added -? here
      { message: `${fieldName} must be a valid number` }
    )
    .transform((val) => (val === "" ? 0 : Number(val)));
// ✅ Schema

const paymentSplitSchema = z
  .object({
    Payment_Type: z
      .enum(["Cash", "Cheque", "Neft", "Bank"])
      .or(z.literal("")) // allow blank select
      .refine((val) => val !== "", {
        message: "Please select a payment type.",
      }),

    // Required only when Payment_Type === "Bank"
    Bank_Account_Id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .optional(),

    Reference_Number: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val ?? ""),

    Amount: digitsOnly("Amount", true),
  })
  .refine((data) => data.Payment_Type !== "Bank" || !!data.Bank_Account_Id, {
    message: "Please select a bank account.",
    path: ["Bank_Account_Id"],
  });

export const purchaseFormSchema = z
  .object({
    Party_Name: z.string().min(1, "Party_Name is required"),

    GSTIN: z.preprocess(
      (val) => {
        if (val === undefined || val === null) return "";
        return String(val);
      },
      z.string().refine((val) => val.length === 0 || val.length === 15, {
        message: "GSTIN must be exactly 15 characters",
      })
    ),

    Bill_Number: z.string().min(1, "Bill_Number is required"),

    Bill_Date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Bill_Date must be a valid date",
    }),

    State_Of_Supply: z.string().min(1, "State_Of_Supply is required"),

    // 🔹 Auto-calculated but cannot be empty
    Total_Amount: digitsOnly("Total_Amount", true),
    Balance_Due: digitsOnly("Balance_Due", true),

    // 🔹 Optional but digits if provided
    Total_Paid: z.string().optional().or(digitsOnly("Total_Paid", false)),

  //   Payment_Type: z
  //     .enum(["Cash", "Cheque", "Neft", "Bank"])
  //     .or(z.literal("")) // allow blank select
  //     .refine((val) => val !== "", {
  //       message: "Please select a payment type.",
  //     }),

  //   // 🔹 Required only when Payment_Type === "Bank"
  //   Bank_Account_Id: z
  //     .union([z.number(), z.string(), z.null(), z.undefined()])
  //     .optional(),

  //      Reference_Number: z
  // .string()
  // .trim()
  // .nullable()
  // .optional()
  // .transform((val) => val ?? ""),

    // Reference_Number: z.string().trim().optional().or(z.literal("")),

    // Stock_Quantity: digitsOnly("Stock_Quantity"),
 splits: z
      .array(paymentSplitSchema)
      .min(1, "At least one payment split is required")
      .superRefine((splits, ctx) => {
        let cashSeen = false;
        const seenBankAccounts = new Set();

        splits.forEach((split, index) => {
          if (split.Payment_Type === "Cash") {
            if (cashSeen) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Only one Cash split is allowed.",
                path: [index, "Payment_Type"],
              });
            }
            cashSeen = true;
          }

          if (split.Payment_Type === "Bank" && split.Bank_Account_Id) {
            if (seenBankAccounts.has(split.Bank_Account_Id)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "Each bank account can only be used once. Edit the existing split instead of adding a duplicate.",
                path: [index, "Bank_Account_Id"],
              });
            }
            seenBankAccounts.add(split.Bank_Account_Id);
          }
        });
      }),
    items: z
      .array(
        z.object({
          Item_Category: z.string().min(1, "Item category is required"),
          Item_Name: z.string().min(1, "Item name is required"),

          Item_HSN: z.preprocess((val) => {
            if (val === undefined || val === null) return "";
            return String(val).trim();
          }, z.string()
            .min(4, "HSN Code must be at least 4 digits.")
            .max(8, "HSN Code must be at most 8 digits.")
            .regex(/^\d+$/, "HSN Code must contain only digits (0-9).")
          ),

          // Quantity: z.preprocess(
          //   (val) => {
          //     if (val === "" || val === undefined || val === null) return undefined;
          //     return Number(val);
          //   },
          //   z
          //     .number({
          //       required_error: "Quantity is required",
          //       invalid_type_error: "Quantity must be a number",
          //     })
          //     .min(1, "Quantity must be greater than zero")
          // ),
  Quantity: z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  },
  z.number().min(1, "Quantity must be greater than zero")
),
          Item_Unit: z.string().min(1, "Unit is required"),

          Purchase_Price: digitsOnly("Purchase_Price", true).refine(
            (num) => num === undefined || num > 0,
            { message: "Purchase Price must be  greater than 0" }
          ),

          Discount_On_Purchase_Price: digitsOnly("Discount_On_Purchase_Price", false).optional(),
          Discount_Type_On_Purchase_Price: z.enum(["Percentage", "Amount"]).optional(),
          Tax_Type: z.string().min(1, "Tax_Type is required").optional().default("None"),
          Tax_Amount: digitsOnly("Tax_Amount", false),
          Amount: digitsOnly("Amount", false),
        })
      )
      .nonempty("At least one item must be added"),
  })
  .refine(
    (data) => data.Payment_Type !== "Bank" || !!data.Bank_Account_Id,
    {
      message: "Please select a bank account.",
      path: ["Bank_Account_Id"],
    }
  )
  // .refine(
  //   (data) => Number(data.Balance_Due) >= 0,
  //   {
  //     message: "Received amount should be less than or equal to Total Amount",
  //     path: ["Balance_Due"], // shows the error under the Total Paid field
  //   }
  // );
// export const purchaseFormSchema = z.object({
//   Party_Name: z.string().min(1, "Party_Name is required"),

//             GSTIN: z.preprocess(
//   (val) => {
//     // if undefined or null → treat as empty string
//     if (val === undefined || val === null) return "";
//     return String(val);
//   },
//   z.string()
//     .refine((val) => val.length === 0 || val.length === 15, {
//       message: "GSTIN must be exactly 15 characters",
//     })
// ),

//   Bill_Number: z.string().min(1, "Bill_Number is required"),

//   Bill_Date: z
//     .string()
//     .refine((val) => !isNaN(Date.parse(val)), {
//       message: "Bill_Date must be a valid date",
//     }),

//   State_Of_Supply: z.string().min(1, "State_Of_Supply is required"),

//   // 🔹 Auto-calculated but cannot be empty
//   Total_Amount: digitsOnly("Total_Amount", true),
//   Balance_Due: digitsOnly("Balance_Due", true),

//   // 🔹 Optional but digits if provided
//   Total_Paid: z.string().optional().or(digitsOnly("Total_Paid", false)),
//   Payment_Type: z
//       .enum(["Cash", "Cheque", "Neft"])
//       .or(z.literal("")) // allow blank select
//       .refine((val) => val !== "", {
//         message: "Please select a payment type.",
//       }),
  
//   Reference_Number: z
//   .string()
//   .trim()
//   .optional()
//   .or(z.literal("")),

//   // Stock_Quantity: digitsOnly("Stock_Quantity"),

//   items: z
//     .array(
//       z.object({
//            Item_Category: z.string().min(1, "Item category is required"),
//         Item_Name: z.string().min(1, "Item name is required"),
//         //  Item_HSN: z.string().min(4, "HSN Code is required") max(8, "HSN Code must be at most 20 characters"),.
//         // Item_HSN: z.string()
//         //     // 1. Enforce length (4 to 8 characters)
//         //     .min(4, "HSN Code must be at least 4 digits.")
//         //     .max(8, "HSN Code must be at most 8 digits.")
//         //     // 2. Enforce only digits (0-9)
//         //     .regex(HSN_REGEX, "HSN Code must contain only digits (0-9)."),
//        Item_HSN: z.preprocess((val) => {
//   if (val === undefined || val === null) return "";
//   return String(val).trim();
// }, 
// z.string()
//   .min(4, "HSN Code must be at least 4 digits.")
//   .max(8, "HSN Code must be at most 8 digits.")
//   .regex(/^\d+$/, "HSN Code must contain only digits (0-9).")
// ),
 

//           Quantity: z.preprocess(
//   (val) => {
//     if (val === "" || val === undefined || val === null) return undefined;
//     return Number(val);
//   },
//   z
//     .number({
//       required_error: "Quantity is required",
//       invalid_type_error: "Quantity must be a number",
//     })
//     .min(1, "Quantity must be greater than zero")
// ),

//   //     Quantity: z
//   // .number({
//   //   required_error: "Quantity is required",
//   //   invalid_type_error: "Quantity must be a number",
//   // })
//   // .min(1, "Quantity must be greater than zero"),
//         Item_Unit: z.string().min(1, "Unit is required"),
        
//              Purchase_Price: digitsOnly("Purchase_Price", true).refine(
//           (num) => num === undefined || num > 0,
//           { message: "Purchase Price must be  greater than 0" }
//         ),
//         // Purchase_Price: digitsOnly("Purchase_Price", false),
//         // Purchase_Price_Type: z.enum(["With Tax", "Without Tax"]),
//         Discount_On_Purchase_Price: digitsOnly("Discount_On_Purchase_Price", false).optional(),
//         Discount_Type_On_Purchase_Price: z.enum(["Percentage", "Amount"]).optional(),
//         Tax_Type: z.string().min(1, "Tax_Type is required").optional().default("None"), // ✅ no need to validate enum, UI ensures correctness
//         Tax_Amount: digitsOnly("Tax_Amount", false),
//         Amount: digitsOnly("Amount", false),
//       })
//     )
//     .nonempty("At least one item must be added"),
// });
