import z from "zod";


const loginSchema=z.object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().trim().min(1, "Password is required"),
});

const registerSchema = z.object({
    name: z.string() .trim().min(1, "Name is required"),
    phone: z.string() .trim().min(1, "Phone is required").max(10, "Phone must be at most 10 characters")  
    .regex(/^\+?[0-9\s-]{7,20}$/, "Invalid phone format"),
    email: z.string()  .trim().email("Invalid email address"),
    username: z.string()  .trim().min(1, "Username is required"),
    password: z.string()  .trim().min(1, "Password is required"),
    address: z.string()  .trim().min(1, "Address is required"),
    pincode: z.string().optional().refine(
  (val) =>
    !val || /^[A-Za-z0-9\- ]{3,12}$/.test(val),
  { message: "Invalid pincode format" }
),

city: z.string().optional().refine(
  (val) => !val || val.trim().length >= 1,
  { message: "City must be at least 1 character" }
),
      role: z.enum(["admin", "user"]).default("user"),
  });

export { loginSchema, registerSchema };