import { z } from "zod";

//const HSN_REGEX = /^\d{4,8}$/;

/* ─────────────────────────────────────────────────────────────
   SHARED HELPERS  (same as purchaseFormSchema / purchaseReturnFormSchema)
───────────────────────────────────────────────────────────────*/
const digitsOnly = (fieldName, required = true) =>
  z
    .union([z.string(), z.number()])
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

/* ─────────────────────────────────────────────────────────────
   SHARED ITEM ROW SCHEMA  (identical to purchase/purchase-return — reused)
───────────────────────────────────────────────────────────────*/
const saleReturnItemSchema = z.object({
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

  Quantity: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      return Number(val);
    },
    z
      .number({
        required_error: "Quantity is required",
        invalid_type_error: "Quantity must be a number",
      })
      .min(1, "Quantity must be at least 1")
  ),

  Item_Unit: z.string().min(1, "Unit is required"),

  Sale_Price: digitsOnly("Sale_Price", true).refine(
    (num) => num === undefined || num > 0,
    { message: "Sale Price must be greater than 0" }
  ),

  Discount_On_Sale_Price: digitsOnly(
    "Discount_On_Sale_Price",
    false
  ).optional(),

  Discount_Type_On_Sale_Price: z
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

/* ─────────────────────────────────────────────────────────────
   SALE RETURN SCHEMA
   Extra fields vs sale:
     • Return_Number  — optional, user fills manually
     • Return_Date    — required, defaults to today
   Kept identical (vs purchase return, just renamed back):
     • Total_Paid     — replaces Total_Received
   Kept identical:
     • Party_Name, GSTIN, Bill_Number, Bill_Date,
       State_Of_Supply, Total_Amount, Balance_Due,
       Payment_Type, Reference_Number, items
───────────────────────────────────────────────────────────────*/
export const saleReturnFormSchema = z.object({

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

  Invoice_Number: z.string().min(1, "Invoice Number is required"),

  Invoice_Date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invoice Date must be a valid date",
    }),

  Return_Date: z
    .string()
    .min(1, "Return Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Return Date must be a valid date",
    })
    .default(() => new Date().toISOString().slice(0, 10)), // ✅ today if not provided

  /* ── Supply ── */
  State_Of_Supply: z.string().min(1, "State of Supply is required"),

  /* ── Amounts ── */
  Total_Amount: digitsOnly("Total_Amount", true),

  Total_Paid: z                              // ✅ back to Total_Paid for sale return
    .string()
    .optional()
    .or(digitsOnly("Total_Paid", false)),

  Balance_Due: digitsOnly("Balance_Due", true),

  /* ── Payment ── */
  Payment_Type: z
    .enum(["Cash", "Cheque", "Neft"])
    .or(z.literal(""))
    .refine((val) => val !== "", {
      message: "Please select a payment type",
    }),

  Reference_Number: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => val ?? ""),

  /* ── Items ── */
  items: z
    .array(saleReturnItemSchema)
    .nonempty("At least one item must be added"),
});