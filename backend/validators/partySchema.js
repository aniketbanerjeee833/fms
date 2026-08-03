// import { z } from "zod";
// const GSTIN_REGEX = /^[0-9A-Z]+$/;
//  const partySchema = z.object({

//     Party_Name: z.string().min(1, "Party name is required minimum 1 character"),
//      GSTIN: z.string()
//       .refine(val => val === "" || val.length === 15, {
//           message: "GSTIN must be exactly 15 characters long if provided."
//       })
//       // Add validation for characters
//       .refine(val => val === "" || GSTIN_REGEX.test(val), {
//           message: "GSTIN must contain only uppercase letters (A-Z) and digits (0-9)."
//       }),
//     //Phone_Number: z.string().max(10, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
//      Phone_Number: z.string().optional().or(z.literal("")),
//     State: z.string().min(1, "State is required minimum 1 character")
//     .optional().or(z.literal("")),
    
//     Email_Id: z.string().email("Invalid email address").optional().or(z.literal("")),
//     Billing_Address: z.string().min(5, "Address is required minimum 5 character")
//     .optional().or(z.literal("")),
//    Shipping_Address: z.string().min(5, "Address is required minimum 5 character")
//     .optional().or(z.literal("")),
    
// })
// export default partySchema
import { z } from "zod";

const GSTIN_REGEX = /^[0-9A-Z]+$/;

// const digitsOnly = (fieldName, required = true) =>
//   z.union([z.string(), z.number()])
//     .transform((val) => String(val ?? "").trim())
//     .refine(
//       (val) => (required ? val !== "" : true),
//       { message: `${fieldName} is required` }
//     )
//     .refine(
//       (val) => val === "" || /^-?\d+(\.\d{1,2})?$/.test(val),
//       { message: `${fieldName} must be a valid number` }
//     )
//     .transform((val) => (val === "" ? 0 : Number(val)));
const partyAddressSchema = z.object({
  Address_Type: z.enum(["Billing", "Shipping"]),

  Address_Text: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

      Is_Default: z
    .boolean()
    .optional()
    .default(false),
});
const partySchema = z.object({

  Party_Name: z.string().min(1, "Party name is required minimum 1 character"),

 
  GSTIN: z.string()
    .refine((val) => val === "" || val.length === 15, {
      message: "GSTIN must be exactly 15 characters long if provided.",
    })
    .refine((val) => val === "" || GSTIN_REGEX.test(val), {
      message: "GSTIN must contain only uppercase letters (A-Z) and digits (0-9).",
    })
    .optional(),

  Phone_Number: z.string().optional().or(z.literal("")),

  State: z.string().min(1, "State is required minimum 1 character")
    .optional().or(z.literal("")),

  Email_Id: z.string().email("Invalid email address").optional().or(z.literal("")),
  addresses: z.array(partyAddressSchema).optional().default([]),

//   Billing_Address: z.string().min(5, "Address is required minimum 5 character")
//     .optional().or(z.literal("")),

//   Shipping_Address: z.string().min(5, "Address is required minimum 5 character")
//     .optional().or(z.literal("")),

  /* ─────────────────────────────────────────────
     OPENING BALANCE
  ───────────────────────────────────────────────*/
Opening_Balance: z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .optional()
  .transform((val) => {
    if (val === "" || val === undefined || val === null) return null;   // 🔹 truly untouched
    const n = Number(val);
    return isNaN(n) ? null : n;
  })
  .refine((val) => val === null || val >= 0, {
    message: "Opening Balance cannot be negative",
  }),

  Opening_Balance_Type: z
    .enum(["To_Receive", "To_Pay"])
    .nullable()
    .optional(),

  Opening_Balance_Date: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Opening Balance Date must be a valid date",
    }),

  /* ─────────────────────────────────────────────
     CREDIT LIMIT
  ───────────────────────────────────────────────*/
  Credit_Limit_Type: z
    .enum(["No_Limit", "Custom"])
    .optional()
    .default("No_Limit"),

  Credit_Limit: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    })
    .refine((val) => val === null || val >= 0, {
      message: "Credit Limit cannot be negative",
    }),

})
//   .refine(
//     (data) =>
//       data.Credit_Limit_Type !== "Custom" ||
//       (data.Credit_Limit !== null && data.Credit_Limit > 0),
//     {
//       message: "Please enter a credit limit amount",
//       path: ["Credit_Limit"],
//     }
//   )
  .superRefine((data, ctx) => {
  
    // Opening balance was explicitly entered.
    // IMPORTANT: 0 also counts as explicitly entered.
    if (data.Opening_Balance !== null) {
  
      if (!data.Opening_Balance_Type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["Opening_Balance_Type"],
          message: "Please select To Receive or To Pay",
        });
      }
  
      if (!data.Opening_Balance_Date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["Opening_Balance_Date"],
          message: "Opening Balance Date is required",
        });
      }
    }
      const addresses = data.addresses || [];
    const billingDefaults = addresses.filter(
      (a) =>
        a.Address_Text?.trim() &&
        a.Address_Type === "Billing" &&
        a.Is_Default
    );

    const shippingDefaults = addresses.filter(
      (a) =>
        a.Address_Text?.trim() &&
        a.Address_Type === "Shipping" &&
        a.Is_Default
    );

    if (billingDefaults.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one billing address can be default",
      });
    }

    if (shippingDefaults.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one shipping address can be default",
      });
    }
  });
export default partySchema;
// ""       → null      ✅
// "0"      → 0         ✅
// "5000"   → 5000      ✅
// "-500"   → -500      ❌ cannot be negative
// "hello"  → NaN       ❌ must be valid number
// -- ✅ correct
// SELECT SUM(COALESCE(Opening_Balance, 0)) FROM add_party;