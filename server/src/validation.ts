import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().trim().min(2, "Organization name is required"),
});

export const loginSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(1),
});

const optionalNonNegativeNumber = z
  .union([z.number(), z.string(), z.null()])
  .transform((v, ctx) => {
    if (v === null || v === "" || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a non-negative number" });
      return z.NEVER;
    }
    return n;
  });

const optionalNonNegativeInt = z
  .union([z.number(), z.string(), z.null()])
  .transform((v, ctx) => {
    if (v === null || v === "" || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isInteger(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a non-negative integer" });
      return z.NEVER;
    }
    return n;
  });

const requiredNonNegativeInt = z
  .union([z.number(), z.string()])
  .transform((v, ctx) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isInteger(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a non-negative integer" });
      return z.NEVER;
    }
    return n;
  });

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  description: z.string().nullable().optional(),
  quantityOnHand: requiredNonNegativeInt,
  costPrice: optionalNonNegativeNumber.optional(),
  sellingPrice: optionalNonNegativeNumber.optional(),
  lowStockThreshold: optionalNonNegativeInt.optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const stockAdjustSchema = z.object({
  delta: z
    .union([z.number(), z.string()])
    .transform((v, ctx) => {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isInteger(n) || n === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "delta must be a non-zero integer",
        });
        return z.NEVER;
      }
      return n;
    }),
  note: z.string().optional(),
});

export const settingsSchema = z.object({
  defaultLowStockThreshold: requiredNonNegativeInt,
});

export const roleSchema = z.enum(["ADMIN", "MANAGER", "GUEST"]);

export const userCreateSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  role: roleSchema,
});

export const userUpdateSchema = z.object({
  role: roleSchema,
});
