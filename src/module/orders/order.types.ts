import { z } from "zod";

export const createOrderSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  items: z
    .array(
      z.object({
        medicineId: z.string().min(1, "Medicine ID is required"),
        quantity: z.number().int().positive("Quantity must be at least 1"),
      })
    )
    .min(1, "At least one order item is required"),
});

export type CreateOrderType = z.infer<typeof createOrderSchema>;
