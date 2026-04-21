import { CartItem } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const addToCartService = async (
  userId: string,
  medicineId: string,
  quantity: number = 1,
  priceOverride?: number | null
): Promise<CartItem> => {


  // 1️⃣ Find or create a cart for the user
  let cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  // 2️⃣ Check if item already in cart
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_medicineId: { cartId: cart.id, medicineId } },
  });

  let cartItem: CartItem;
  if (existing) {
    // If already in cart, increment quantity but keep the most recent priceOverride
    cartItem = await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: quantity },
        // Only update priceOverride if a new one is explicitly provided
        ...(priceOverride != null ? { priceOverride } : {}),
      },
    });
  } else {
    cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        medicineId,
        quantity,
        priceOverride: priceOverride ?? null,
      },
    });
  }


  return cartItem;
};


const getMedicineCartStatus = async (
  userId: string,
  medicineId: string
) => {
  // Find the cart of the user
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart) {
    return { inCart: false, quantity: 0 };
  }

  const cartItem = cart.items.find((item) => item.medicineId === medicineId);

  if (!cartItem) {
    return { inCart: false, quantity: 0 };
  }

  return { inCart: true, quantity: cartItem.quantity };
};

const getFromCartService = async (userId: string) => {
  // 1️⃣ Find the user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId }, // ✅ userId exists on Cart
    include: {
      items: {
        include: {
          medicine: true,
        },
      },
    },
  });

  if (!cart) return { items: [], totalQuantity: 0, totalPrice: 0 };

  // 2️⃣ Compute totals
  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.medicine.price, 0);

  return {
    items: cart.items,
    totalQuantity,
    totalPrice,
  };
};

const updateCartItemService = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // Ensure the cart item belongs to the logged-in user
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { medicine: true },
  });

  if (!cartItem) throw new Error("Cart item not found");
//   if (cartItem.cartId !== userId) throw new Error("Unauthorized"); // adjust based on your Cart schema

  // Check stock
  if (quantity > cartItem.medicine.stock) {
    throw new Error("Quantity exceeds available stock");
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { medicine: true },
  });



  return updated;
};

const removeCartItemService = async (userId: string, itemId: string) => {
  // Find the cart item to ensure it belongs to the logged-in user
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!cartItem) throw new Error("Cart item not found");

  // Optional: Verify ownership
  const cart = await prisma.cart.findUnique({
    where: { id: cartItem.cartId },
  });

  if (!cart || cart.userId !== userId) throw new Error("Unauthorized");

  // Delete the cart item
  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  return { success: true, message: "Cart item removed successfully" };
};

const clearCartService = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return { success: true };
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return { success: true, message: "Cart cleared" };
};

export const cartService={
  addToCartService,
  getMedicineCartStatus,
  getFromCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
}