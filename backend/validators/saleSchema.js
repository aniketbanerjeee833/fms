import z from "zod";
const HSN_REGEX = /^\d{4,8}$/;

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
const priceStringDigits = z
  .union([z.string(), z.number()])
  .transform((val) => String(val ?? "").trim())   // normalize everything to string
  .refine((s) => /^\d+(\.\d{0,2})?$/.test(s), {
    message: "must be a valid number with up to 2 decimals",
  })
  .transform((s) => Number(s))
  .refine((num) => !isNaN(num) && num > 0, { message: "must be > 0" });
 const saleSchema = z.object({
  Party_Name: z.string().min(1, "Party_Name is required"),

    GSTIN: z
  .string()
  .optional()
  .refine(
    (val) => !val || val.trim() === "" || val.length === 15,
    { message: "GSTIN must be exactly 15 characters or left empty" }
  ),
    // GSTIN: z
    //   .string({
    //     required_error: "GSTIN is required",
    //     invalid_type_error: "GSTIN must be a string",
    //   })
    //   .length(15, "GSTIN must be exactly 15 characters").optional(),
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
  // Stock_Quantity: digitsOnly("Stock_Quantity"),

  items: z
    .array(
      z.object({
           Item_Category: z.string().min(1, "Item category is required"),
        Item_Name: z.string().min(1, "Item name is required"),
             
 Item_HSN: z.union([z.string(),z.number(), z.undefined(), z.null()])
                          .transform((val) => (val === undefined || val === null ? "" : String(val))) // ✅ Always a string
                          .refine((val) => val.trim() !== "", { message: "HSN Code is required." })
                          .refine((val) => /^\d+$/.test(val), { message: "HSN Code must contain only digits (0-9)." })
                          .refine((val) => val.length >= 4, { message: "HSN Code must be at least 4 digits." })
                          .refine((val) => val.length <= 8, { message: "HSN Code must be at most 8 digits." }),
 Quantity: z.preprocess(
  (val) => Number(val),
  z.number().min(1, "Quantity must be greater than zero")
),

        Item_Unit: z.string().min(1, "Unit is required"),
        // Sale_Price: digitsOnly("Sale_Price"),
        //    Sale_Price: digitsOnly("Sale_Price", true).refine(
        //   (num) => num >= 1,
        //   { message: "Sale Price must be  greater than 0" }
        // ),
  //       Sale_Price: z
  // .number()
  // .min(1, "Sale Price must be greater than 0"),
//    Sale_Price: z.preprocess(
//   (val) => Number(val),
//   z.number().min(1, "Sale Price must be greater than 0")
// ),
// Sale_Price: z.string()
//   .transform((val) => val.trim())
//   .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
//     message: "Sale Price must be a valid number with up to 2 decimal places",
//   })
//   .transform((val) => Number(val))
//   .refine((num) => num >= 1, {
//     message: "Sale Price must be greater than 0",
//   }),
Sale_Price:priceStringDigits,

        // Purchase_Price_Type: z.enum(["With Tax", "Without Tax"]),
        Discount_On_Sale_Price: digitsOnly("Discount_On_Sale_Price", false).optional(),
        Discount_Type_On_Sale_Price: z.enum(["Percentage", "Amount"]).optional(),
        Tax_Type: z.string().min(1, "Tax_Type is required").optional().default("None"), // ✅ no need to validate enum, UI ensures correctness
        Tax_Amount: digitsOnly("Tax_Amount", false),
        Amount: digitsOnly("Amount", false),
      })
    )
    .nonempty("At least one item must be added"),
})
// .refine(
//     (data) => data.Payment_Type !== "Bank" || !!data.Bank_Account_Id,
//     {
//       message: "Please select a bank account.",
//       path: ["Bank_Account_Id"],
//     }
//   );

export default saleSchema;