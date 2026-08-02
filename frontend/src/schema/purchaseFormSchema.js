import { z } from "zod";
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

// const paymentSplitSchema = z
//   .object({
//     Payment_Type: z
//       .enum(["Cash", "Cheque", "Neft", "Bank"])
//       .or(z.literal("")) // allow blank select
//       .refine((val) => val !== "", {
//         message: "Please select a payment type.",
//       }),

//     // Required only when Payment_Type === "Bank"
//     Bank_Account_Id: z
//       .union([z.number(), z.string(), z.null(), z.undefined()])
//       .optional(),

//     Reference_Number: z
//       .string()
//       .trim()
//       .nullable()
//       .optional()
//       .transform((val) => val ?? ""),

//     Amount: digitsOnly("Amount", true),
//   })
const paymentSplitSchema = z
  .object({
    Payment_Type: z
      .enum(["Cash", "Cheque", "Neft", "Bank"])
      .or(z.literal(""))
      .optional()
      .default(""),   // 🔹 no longer forces a selection

    Bank_Account_Id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .optional(),

    Reference_Number: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val ?? ""),

    Amount: digitsOnly("Amount", false), // 🔹 required: false now
  })
  .refine((data) => data.Payment_Type !== "Bank" || !!data.Bank_Account_Id, {
    message: "Please select a bank account.",
    path: ["Bank_Account_Id"],
  });
 

export const purchaseFormSchema = z.object({
  Party_Name: z.string().min(1, "Party_Name is required"), // 🔹 only real requirement

 GSTIN: z.preprocess(
  (val) => (val === null || val === undefined ? "" : String(val)),
  z.string().refine((val) => val === "" || val.length === 15, {
    message: "GSTIN must be exactly 15 characters or left empty",
  })
),

  // 🔹 Bill Number optional now — Vyapar shows it blank and still saves
  Bill_Number: z.string().optional().default(""),

  Bill_Date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Bill_Date must be a valid date" }),

  State_Of_Supply: z.string().nullable().optional(),

  // 🔹 Totals can legitimately be 0 for an empty bill
  Total_Amount: digitsOnly("Total_Amount", false).default(0),
  Balance_Due: digitsOnly("Balance_Due", false).default(0),
  Total_Paid: z.string().optional().or(digitsOnly("Total_Paid", false)),

  // 🔹 splits optional — Vyapar defaults Payment Type to "Cash" but doesn't force a split entry to exist server-side if amount is 0
  splits: z
    .array(paymentSplitSchema)
    .optional()
    .default([])
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
              message: "Each bank account can only be used once.",
              path: [index, "Bank_Account_Id"],
            });
          }
          seenBankAccounts.add(split.Bank_Account_Id);
        }
      });
    }),
  //  splits: z
  //       .array(paymentSplitSchema)
  //       .min(1, "At least one payment split is required")
  //       .superRefine((splits, ctx) => {
  //         let cashSeen = false;
  //         const seenBankAccounts = new Set();
  
  //         splits.forEach((split, index) => {
  //           if (split.Payment_Type === "Cash") {
  //             if (cashSeen) {
  //               ctx.addIssue({
  //                 code: z.ZodIssueCode.custom,
  //                 message: "Only one Cash split is allowed.",
  //                 path: [index, "Payment_Type"],
  //               });
  //             }
  //             cashSeen = true;
  //           }
  
  //           if (split.Payment_Type === "Bank" && split.Bank_Account_Id) {
  //             if (seenBankAccounts.has(split.Bank_Account_Id)) {
  //               ctx.addIssue({
  //                 code: z.ZodIssueCode.custom,
  //                 message:
  //                   "Each bank account can only be used once. Edit the existing split instead of adding a duplicate.",
  //                 path: [index, "Bank_Account_Id"],
  //               });
  //             }
  //             seenBankAccounts.add(split.Bank_Account_Id);
  //           }
  //         });
  //       }),

  // 🔹 items — allowed to be empty array entirely (Vyapar's 2 blank rows never get submitted as "items")
  items: z
    .array(
      z.object({
        Item_Category: z.string().optional().default(""),
        Item_Name: z.string().optional().default(""), // 🔹 no longer forces min(1)
        Item_HSN: z
          .union([z.string(), z.number(), z.undefined(), z.null()])
          .transform((val) => (val === undefined || val === null ? "" : String(val).trim()))
          .refine((val) => val === "" || /^\d{4,8}$/.test(val), {
            message: "HSN Code must be 4-8 digits if provided",
          }),
        Quantity: z.preprocess(
          (val) => {
            if (val === "" || val === undefined || val === null) return 0;
            const n = Number(val);
            return isNaN(n) ? 0 : n;
          },
          z.number().min(0, "Quantity cannot be negative")
        ),
        Item_Unit: z.string().optional().default(""),
        Purchase_Price: z
          .union([z.string(), z.number()])
          .transform((val) => String(val ?? "").trim())
          .refine((s) => s === "" || /^\d+(\.\d{0,2})?$/.test(s), {
            message: "Purchase Price must be a valid number with up to 2 decimals",
          })
          .transform((s) => (s === "" ? 0 : Number(s)))
          .refine((num) => num >= 0, { message: "Purchase Price cannot be negative" }),
        Discount_On_Purchase_Price: digitsOnly("Discount_On_Purchase_Price", false).optional(),
        Discount_Type_On_Purchase_Price: z.enum(["Percentage", "Amount"]).optional(),
        Tax_Type: z.string().optional().default("None"),
        Tax_Amount: digitsOnly("Tax_Amount", false),
        Amount: digitsOnly("Amount", false),
      })
    )
    .optional()
    .default([]),   // 🔹 array itself optional — no .nonempty() anymore
});

