import { z } from "zod";

/* ─────────────────────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────────────────────────*/
const digitsOnly = (fieldName, required = true) =>
  z.union([z.string(), z.number()])
    .transform((val) => String(val ?? "").trim())
    .refine(
      (val) => (required ? val !== "" : true),
      { message: `${fieldName} is required` }
    )
    .refine(
      (val) => val === "" || /^-?\d+(\.\d{1,2})?$/.test(val),
      { message: `${fieldName} must be a valid number` }
    )
    .transform((val) => (val === "" ? 0 : Number(val)));

/* ─────────────────────────────────────────────────────────────
   PAYMENT SPLIT — relaxed, matches Purchase's paymentSplitSchema
───────────────────────────────────────────────────────────────*/
const paymentSplitSchema = z
  .object({
    Payment_Type: z
      .enum(["Cash", "Cheque", "Neft", "Bank"])
      .or(z.literal(""))
      .optional()
      .default(""),   // 🔻 was: .refine(val => val !== "", ...) — no longer forces a selection

    Bank_Account_Id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .optional(),

    Reference_Number: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val ?? ""),

    Amount: digitsOnly("Amount", false),   // 🔻 was: required true + .refine(val > 0, ...)
  })
  .refine(
    (data) => data.Payment_Type !== "Bank" || !!data.Bank_Account_Id,
    { message: "Please select a bank account.", path: ["Bank_Account_Id"] }
  );

/* ─────────────────────────────────────────────────────────────
   EXPENSE ITEM — with GST (relaxed, matches Purchase item schema)
───────────────────────────────────────────────────────────────*/
const expenseItemWithGSTSchema = z.object({
  Item_Name: z.string().optional().default(""),   // 🔻 was: min(1) required

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
    z.number().min(0, "Quantity cannot be negative")   // 🔻 was: min(1) required
  ),

  Price: z
    .union([z.string(), z.number()])
    .transform((val) => String(val ?? "").trim())
    .refine((s) => s === "" || /^\d+(\.\d{0,2})?$/.test(s), {
      message: "Price must be a valid number with up to 2 decimals",
    })
    .transform((s) => (s === "" ? 0 : Number(s)))
    .refine((num) => num >= 0, { message: "Price cannot be negative" }),   // 🔻 was: required, must be >0

  Discount_On_Price: digitsOnly("Discount_On_Price", false).optional(),
  Discount_Type_On_Price: z.enum(["Percentage", "Amount"]).optional().default("Percentage"),
  Tax_Type: z.string().optional().default("None"),
  Tax_Amount: digitsOnly("Tax_Amount", false),
  Amount: digitsOnly("Amount", false),
});

/* ─────────────────────────────────────────────────────────────
   EXPENSE ITEM — without GST (relaxed)
───────────────────────────────────────────────────────────────*/
const expenseItemWithoutGSTSchema = z.object({
  Item_Name: z.string().optional().default(""),   // 🔻 was: min(1) required

  Item_HSN: z
    .preprocess(
      (val) => (val === undefined || val === null ? "" : String(val).trim()),
      z.string().optional()
    ),

  Quantity: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    },
    z.number().nullable().optional()
  ),

  Price: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => (val === "" || val === undefined || val === null ? null : Number(val))),

  Discount_On_Price: digitsOnly("Discount_On_Price", false).optional(),
  Discount_Type_On_Price: z.enum(["Percentage", "Amount"]).optional().default("Percentage"),
  Tax_Type: z.string().optional().default("None"),
  Tax_Amount: digitsOnly("Tax_Amount", false),

  Amount: digitsOnly("Amount", false),   // 🔻 was: required true + must be >0
});

/* ─────────────────────────────────────────────────────────────
   BASE FIELDS — relaxed
───────────────────────────────────────────────────────────────*/
const expenseBaseSchema = z.object({
  Expense_Number: z.string().trim().optional().default(""),

  Expense_Date: z
    .string()
    .min(1, "Expense Date is required")   // 🔹 kept required — same role as Bill_Date in Purchase
    .refine((val) => !isNaN(Date.parse(val)), { message: "Expense Date must be a valid date" }),

  With_GST: z.boolean().optional().default(false),

  Category_Name: z.string().trim().optional().default(""),   // 🔻 was: min(1) required

  Category_Type: z.enum(["Direct", "Indirect"]).optional().default("Indirect"),

  Total_Amount: digitsOnly("Total_Amount", false).default(0),   // 🔻 was: required, must be >0

  Total_Paid: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" || val === undefined || val === null ? 0 : Number(val)))
    .refine((val) => !isNaN(val) && val >= 0, { message: "Total Paid must be a valid number" }),

  // 🔹 splits optional — array itself can be empty, no forced minimum
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
});

/* ─────────────────────────────────────────────────────────────
   WITH GST SCHEMA — relaxed
───────────────────────────────────────────────────────────────*/
const expenseWithGSTSchema = expenseBaseSchema
  .extend({
    With_GST: z.literal(true),

    Bill_Date: z.string().optional().default(""),   // 🔻 was: required

    Party_Name: z.string().optional().default(""),   // 🔻 was: min(1) required

    State_Of_Supply: z.string().nullable().optional(),

    // 🔹 items array optional/empty-allowed — matches Purchase's approach
    items: z.array(expenseItemWithGSTSchema).optional().default([]),   // 🔻 was: nonempty required
  })
  .refine(
    (data) => data.Total_Paid <= data.Total_Amount,
    { message: "Paid amount cannot exceed Total Amount", path: ["Total_Paid"] }
  );
  // 🔻 REMOVED the splits-sum-must-equal-Total_Paid .refine() — this is now enforced
  //    server-side against validSplits (the computed, filtered array), same as Purchase/Sale,
  //    since the frontend's raw splits may still contain blank/zero placeholder rows.

/* ─────────────────────────────────────────────────────────────
   WITHOUT GST SCHEMA — relaxed
───────────────────────────────────────────────────────────────*/
const expenseWithoutGSTSchema = expenseBaseSchema
  .extend({
    With_GST: z.literal(false).or(z.undefined()),

    Bill_Date: z.string().optional().default(""),
    Party_Name: z.string().optional().default(""),
    State_Of_Supply: z.string().nullable().optional(),

    items: z.array(expenseItemWithoutGSTSchema).optional().default([]),   // 🔻 was: nonempty required
  });
  // 🔻 REMOVED: "Total Paid must equal Total Amount for non-GST" refine
  //    — an empty/draft non-GST expense should be saveable with Total_Paid: 0 too.
  //    Keep this rule as a soft backend check if you want to still enforce it,
  //    but only once Total_Amount > 0 (matches "empty form is exempt" pattern).
  // 🔻 REMOVED the splits-sum-must-equal-Total_Paid .refine() — same reasoning as GST version.

/* ─────────────────────────────────────────────────────────────
   DISCRIMINATED UNION
───────────────────────────────────────────────────────────────*/
export const expenseFormSchema = z.discriminatedUnion("With_GST", [
  expenseWithGSTSchema,
  expenseWithoutGSTSchema,
]);