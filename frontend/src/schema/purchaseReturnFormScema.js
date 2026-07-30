import { z } from "zod";



/* ─────────────────────────────────────────────────────────────
   SHARED HELPERS  (same as purchaseFormSchema)
───────────────────────────────────────────────────────────────*/
// const digitsOnly = (fieldName, required = true) =>
//   z
//     .union([z.string(), z.number()])
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
/* ─────────────────────────────────────────────────────────────
   SHARED ITEM ROW SCHEMA  (identical to purchase — reused)
───────────────────────────────────────────────────────────────*/
const purchaseReturnItemSchema = z.object({
  Item_Category: z.string().min(1, "Item category is required"),

  Item_Name: z.string().min(1, "Item name is required"),

  Item_HSN: z.preprocess(
    (val) => (val === undefined || val === null ? "" : String(val).trim()),
    z
      .string()
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
  //     .min(1, "Quantity must be at least 1")
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
    { message: "Purchase Price must be greater than 0" }
  ),

  Discount_On_Purchase_Price: digitsOnly(
    "Discount_On_Purchase_Price",
    false
  ).optional(),

  Discount_Type_On_Purchase_Price: z
    .enum(["Percentage", "Amount"])
    .optional()
    .default("Percentage"),

  Tax_Type: z
    .string()
    .optional()
    .default("None"),

  Tax_Amount: digitsOnly("Tax_Amount", false),

  Amount: digitsOnly("Amount", false),
});

// ── Single split-row schema ──
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

export const purchaseReturnFormSchema = z
  .object({
    /* ── Party ── */
    Party_Name: z.string().min(1, "Party is required"),

    GSTIN: z.preprocess(
      (val) => (val === undefined || val === null ? "" : String(val)),
      z.string().refine(
        (val) => val.length === 0 || val.length === 15,
        { message: "GSTIN must be exactly 15 characters" }
      )
    ),

    /* ── Return-specific fields ── */
    Return_Number: z
      .string()
      .trim()
      .min(1, "Return Number is required"),

    Bill_Number: z.string().min(1, "Bill Number is required"),

    Bill_Date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Bill Date must be a valid date",
      }),

    Return_Date: z
      .string()
      .min(1, "Return Date is required")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Return Date must be a valid date",
      })
      .default(() => new Date().toISOString().slice(0, 10)), // today if not provided

    /* ── Supply ── */
    State_Of_Supply: z.string().min(1, "State of Supply is required"),

    /* ── Amounts ──
       Total_Received and Balance_Due are DERIVED from splits[] at submit
       time (see onSubmit) — still validated here since they're still sent
       in the payload, but they're never hand-edited by the user once
       showSplitBox is true, and even in single-payment mode the real
       source of truth is splits.0.Amount, not this field. */
    Total_Amount: digitsOnly("Total_Amount", true),

    Total_Received: z
      .string()
      .optional()
      .or(digitsOnly("Total_Received", false)),

    Balance_Due: digitsOnly("Balance_Due", true),

    /* ── Payment — splits[] is the single source of truth.
       A single, non-split payment is just splits with one entry. ── */
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

    /* ── Items ── */
    items: z
      .array(purchaseReturnItemSchema)
      .nonempty("At least one item must be added"),
  })
  
// export const purchaseReturnFormSchema = z.object({

//   /* ── Party ── */
//   Party_Name: z.string().min(1, "Party is required"),

//   GSTIN: z.preprocess(
//     (val) => (val === undefined || val === null ? "" : String(val)),
//     z.string().refine(
//       (val) => val.length === 0 || val.length === 15,
//       { message: "GSTIN must be exactly 15 characters" }
//     )
//   ),

//   /* ── Return-specific fields ── */
//   Return_Number: z
//     .string()
//     .trim()
//     .min(1, "Return Number is required"),
  

//   Bill_Number: z.string().min(1, "Bill Number is required"),

//   Bill_Date: z
//     .string()
//     .refine((val) => !isNaN(Date.parse(val)), {
//       message: "Bill Date must be a valid date",
//     }),

//   Return_Date: z
//     .string()
//     .min(1, "Return Date is required")
//     .refine((val) => !isNaN(Date.parse(val)), {
//       message: "Return Date must be a valid date",
//     })
//     .default(() => new Date().toISOString().slice(0, 10)), // ✅ today if not provided

//   /* ── Supply ── */
//   State_Of_Supply: z.string().min(1, "State of Supply is required"),

//   /* ── Amounts ── */
//   Total_Amount: digitsOnly("Total_Amount", true),

//   Total_Received: z                          // ✅ renamed from Total_Paid
//     .string()
//     .optional()
//     .or(digitsOnly("Total_Received", false)),

//   Balance_Due: digitsOnly("Balance_Due", true),

//   /* ── Payment ── */
//    Payment_Type: z
//       .enum(["Cash", "Cheque", "Neft", "Bank"])
//       .or(z.literal("")) // allow blank select
//       .refine((val) => val !== "", {
//         message: "Please select a payment type.",
//       }),

//     // 🔹 Required only when Payment_Type === "Bank"
//     Bank_Account_Id: z
//       .union([z.number(), z.string(), z.null(), z.undefined()])
//       .optional(),
//  Reference_Number: z
//   .string()
//   .trim()
//   .nullable()
//   .optional()
//   .transform((val) => val ?? ""),

//   /* ── Items ── */
//   items: z
//     .array(purchaseReturnItemSchema)
//     .nonempty("At least one item must be added"),
// }).refine(
//     (data) => data.Payment_Type !== "Bank" || !!data.Bank_Account_Id,
//     {
//       message: "Please select a bank account.",
//       path: ["Bank_Account_Id"],
//     }
//   );