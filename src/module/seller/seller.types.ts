import { z } from "zod";

// Zod schema for medicine POST request
export const postMedicineSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  image: z.string().url().nullable().optional(), // optional and nullable for Prisma
  price: z.number().positive("Price must be greater than 0"),
  stock: z.number().int().nonnegative("Stock must be 0 or more"),
  manufacturer: z.string().min(2, "Manufacturer must be at least 2 characters"),
  category: z
    .array(z.string().min(1, "Category ID cannot be empty"))
    .min(1, "At least one category is required"),
});

export const updateMedicineSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  image: z.string().url().nullable().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  manufacturer: z.string().min(2).optional(),
  category: z.array(z.string().min(1)).optional(), // optional array
});

export type updateMedicineType = z.infer<typeof updateMedicineSchema>;

// TypeScript type inferred from Zod schema
export type postMedicineType = z.infer<typeof postMedicineSchema>;
