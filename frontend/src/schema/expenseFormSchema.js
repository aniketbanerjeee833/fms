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
   PAYMENT SPLIT
───────────────────────────────────────────────────────────────*/
const paymentSplitSchema = z
  .object({
    Payment_Type: z
      .enum(["Cash", "Cheque", "Neft", "Bank"])
      .or(z.literal(""))
      .refine((val) => val !== "", { message: "Please select a payment type." }),
 
    Bank_Account_Id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .optional(),
 
    Reference_Number: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val ?? ""),
 
    Amount: digitsOnly("Amount", true).refine(
      (val) => val > 0,
      { message: "Split amount must be greater than 0" }
    ),
  })
  .refine(
    (data) => data.Payment_Type !== "Bank" || !!data.Bank_Account_Id,
    { message: "Please select a bank account.", path: ["Bank_Account_Id"] }
  );
 
/* ─────────────────────────────────────────────────────────────
   EXPENSE ITEM  — with GST (all fields required)
───────────────────────────────────────────────────────────────*/
const expenseItemWithGSTSchema = z.object({
  Item_Name: z.string().trim().min(1, "Item name is required"),
 
  Item_HSN: z
    .preprocess(
      (val) => (val === undefined || val === null ? "" : String(val).trim()),
      z.string().optional()
    ),
 
  Quantity: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    },
    z.number().min(1, "Quantity must be at least 1")
  ),
 
  Price: digitsOnly("Price", true).refine(
    (val) => val > 0,
    { message: "Price must be greater than 0" }
  ),
 
  Discount_On_Price: digitsOnly("Discount_On_Price", false).optional(),
 
  Discount_Type_On_Price: z
    .enum(["Percentage", "Amount"])
    .optional()
    .default("Percentage"),
 
  Tax_Type: z.string().optional().default("None"),
 
  Tax_Amount: digitsOnly("Tax_Amount", false),
 
  Amount: digitsOnly("Amount", false),
});
 
/* ─────────────────────────────────────────────────────────────
   EXPENSE ITEM  — without GST (only Item_Name + Amount required)
───────────────────────────────────────────────────────────────*/
const expenseItemWithoutGSTSchema = z.object({
  Item_Name: z.string().trim().min(1, "Item name is required"),
 
  Item_HSN: z
    .preprocess(
      (val) => (val === undefined || val === null ? "" : String(val).trim()),
      z.string().optional()
    ),
 
  // Quantity + Price optional for non-GST
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
 
  Discount_Type_On_Price: z
    .enum(["Percentage", "Amount"])
    .optional()
    .default("Percentage"),
 
  Tax_Type: z.string().optional().default("None"),
 
  Tax_Amount: digitsOnly("Tax_Amount", false),
 
  Amount: digitsOnly("Amount", true).refine(
    (val) => val > 0,
    { message: "Amount must be greater than 0" }
  ),
});
 
/* ─────────────────────────────────────────────────────────────
   BASE FIELDS  (common to both GST and non-GST)
───────────────────────────────────────────────────────────────*/
const expenseBaseSchema = z.object({
  Expense_Number: z.string().trim().optional(),
 
  Expense_Date: z
    .string()
    .min(1, "Expense Date is required")
    .refine((val) => !isNaN(Date.parse(val)), { message: "Expense Date must be a valid date" }),
 
  With_GST: z.boolean().optional().default(false),
 
  Category_Name: z.string().trim().min(1, "Category is required"),
 
  Category_Type: z
    .enum(["Direct", "Indirect"])
    .optional()
    .default("Indirect"),
 
  Total_Amount: digitsOnly("Total_Amount", true).refine(
    (val) => val > 0,
    { message: "Total Amount must be greater than 0" }
  ),
 
  Total_Paid: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return 0;
      return Number(val);
    })
    .refine((val) => !isNaN(val) && val >= 0, { message: "Total Paid must be a valid number" }),
 
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
   WITH GST SCHEMA
───────────────────────────────────────────────────────────────*/
const expenseWithGSTSchema = expenseBaseSchema
  .extend({
    With_GST: z.literal(true),
 
    Bill_Date: z
      .string()
      .min(1, "Bill Date is required")
      .refine((val) => !isNaN(Date.parse(val)), { message: "Bill Date must be a valid date" }),
 
    Party_Name: z.string().trim().min(1, "Party is required"),
 
  //  State_Of_Supply: z.string().optional(),
   State_Of_Supply: z.string().nullable().optional(),
    items: z
      .array(expenseItemWithGSTSchema)
      .nonempty("At least one item is required"),
  })
  .refine(
    (data) => data.Total_Paid <= data.Total_Amount,
    {
      message: "Paid amount cannot exceed Total Amount",
      path: ["Total_Paid"],
    }
  )
  .refine(
    (data) => {
      if (data.Total_Paid === 0) return true; // no splits needed if nothing paid
      const splitsSum = data.splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
      return Math.round(splitsSum * 100) === Math.round(data.Total_Paid * 100);
    },
    {
      message: "Split amounts must add up to Total Paid",
      path: ["splits"],
    }
  );
 
/* ─────────────────────────────────────────────────────────────
   WITHOUT GST SCHEMA
───────────────────────────────────────────────────────────────*/
const expenseWithoutGSTSchema = expenseBaseSchema
  .extend({
    With_GST: z.literal(false).or(z.undefined()).or(z.literal(false)),
 
    // Party + Bill Date + State optional for non-GST
    Bill_Date: z.string().optional(),
    // Party_Name: z.string().optional(),
    // State_Of_Supply: z.string().optional(),
 
    items: z
      .array(expenseItemWithoutGSTSchema)
      .nonempty("At least one item is required"),
  })
  .refine(
    (data) => {
      // non-GST: must pay full amount
      return Math.round(data.Total_Paid * 100) === Math.round(data.Total_Amount * 100);
    },
    {
      message: "Total Paid must equal Total Amount for non-GST expenses",
      path: ["Total_Paid"],
    }
  )
  .refine(
    (data) => {
      const splitsSum = data.splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
      return Math.round(splitsSum * 100) === Math.round(data.Total_Paid * 100);
    },
    {
      message: "Split amounts must add up to Total Paid",
      path: ["splits"],
    }
  );
 
/* ─────────────────────────────────────────────────────────────
   DISCRIMINATED UNION  — pick the right schema based on With_GST
   Usage:
     const result = expenseFormSchema.safeParse(formData);
     if (!result.success) console.log(result.error.flatten());
───────────────────────────────────────────────────────────────*/
export const expenseFormSchema = z.discriminatedUnion("With_GST", [
  expenseWithGSTSchema,     // With_GST: true
  expenseWithoutGSTSchema,  // With_GST: false
]);
 

// const {
//   control,
//   register,
//   handleSubmit,
//   setValue,
//   watch,
//   clearErrors,
//   formState: { errors },
// } = useForm({
//   resolver: zodResolver(expenseFormSchema),
//   defaultValues: {
//     Expense_Number: "",
//     Expense_Date: "",
//     With_GST: false,

//     Category_Name: "",
//     Category_Type: "Indirect",

//     // GST fields
//     Bill_Date: "",
//     State_Of_Supply: "",
//     Reference_Number: "",

//     Total_Amount: "",
//     Total_Paid: "",

//     splits: [
//       {
//         Payment_Type: "Cash",
//         Bank_Account_Id: null,
//         Reference_Number: "",
//         Amount: "",
//       },
//     ],

//     items: [
//       {
//         Item_Name: "",
//         Item_HSN: "",
//         Quantity: "",
//         Price: "",
//         Discount_On_Price: "",
//         Discount_Type_On_Price: "Percentage",
//         Tax_Type: "None",
//         Tax_Amount: "",
//         Amount: "",
//       },
//     ],
//   },
// });