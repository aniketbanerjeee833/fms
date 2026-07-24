import { z } from "zod";
const GSTIN_REGEX = /^[0-9A-Z]+$/;
 const partySchema = z.object({

    Party_Name: z.string().min(1, "Party name is required minimum 1 character"),
     GSTIN: z.string()
      .refine(val => val === "" || val.length === 15, {
          message: "GSTIN must be exactly 15 characters long if provided."
      })
      // Add validation for characters
      .refine(val => val === "" || GSTIN_REGEX.test(val), {
          message: "GSTIN must contain only uppercase letters (A-Z) and digits (0-9)."
      }),
    //Phone_Number: z.string().max(10, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
     Phone_Number: z.string().optional().or(z.literal("")),
    State: z.string().min(1, "State is required minimum 1 character")
    .optional().or(z.literal("")),
    
    Email_Id: z.string().email("Invalid email address").optional().or(z.literal("")),
    Billing_Address: z.string().min(5, "Address is required minimum 5 character")
    .optional().or(z.literal("")),
   Shipping_Address: z.string().min(5, "Address is required minimum 5 character")
    .optional().or(z.literal("")),
    
})
export default partySchema