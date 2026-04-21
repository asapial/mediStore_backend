import { CartItem } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import status from "http-status";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: find the currently active, approved flash sale for a medicine
// ─────────────────────────────────────────────────────────────────────────────
const findActiveFlashSale = async (medicineId: string) => {
  const now = new Date();
  return prisma.flashSale.findFirst({
    where: {
      medicineId,
      isApproved: true,
      startAt: { lte: now },
      endAt: { gte: now },
    },
    orderBy: { endAt: "asc" },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// addToCartService
//
// Flash-sale logic:
//   • If priceOverride is supplied (customer is buying from the flash-sale
//     section), we look up the active flash sale and compute:
//       flashQty  = min(requested quantity, remaining flash-sale stock)
//     The first `flashQty` units are priced at the flash discountPrice.
//     The remaining (quantity − flashQty) units are priced at regularPrice.
//
//   • flashQuantity stored on CartItem tracks how many units in this row
//     carry the flash-sale price so the totals can be computed correctly.
// ─────────────────────────────────────────────────────────────────────────────
const addToCartService = async (
  userId: string,
  medicineId: string,
  quantity: number = 1,
  priceOverride?: number | null
): Promise<CartItem> => {
  // 1️⃣  Fetch medicine (stock check)
  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) throw new AppError(status.NOT_FOUND, "Medicine not found");

  // 2️⃣  Find or create cart
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });

  // 3️⃣  Check existing cart item (to know current committed quantity)
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_medicineId: { cartId: cart.id, medicineId } },
  });

  const currentQtyInCart = existing?.quantity ?? 0;
  const totalQtyAfterAdd = currentQtyInCart + quantity;

  // 4️⃣  Validate against total stock
  if (totalQtyAfterAdd > medicine.stock) {
    throw new AppError(
      status.BAD_REQUEST,
      `Only ${medicine.stock} unit(s) available in stock (you already have ${currentQtyInCart} in cart).`
    );
  }

  // 5️⃣  Resolve flash-sale allocation
  let newFlashQtyForThisAdd = 0;
  let resolvedPriceOverride: number | null = null;

  if (priceOverride != null) {
    const flashSale = await findActiveFlashSale(medicineId);

    if (flashSale) {
      // Total flash slots available globally (across all carts and orders):
      //   saleStock - soldCount  = slots not yet claimed by a placed order
      // This cart may already hold some of those slots (alreadyFlashInCart).
      // Additional flash units this add can claim = global available - already held by this cart
      const alreadyFlashInCart = existing?.flashQuantity ?? 0;
      const globalAvailable    = flashSale.saleStock - flashSale.soldCount;
      const additionalFlash    = Math.max(0, globalAvailable - alreadyFlashInCart);

      newFlashQtyForThisAdd = Math.min(quantity, additionalFlash);
      resolvedPriceOverride = newFlashQtyForThisAdd > 0 ? flashSale.discountPrice : null;
    }
    // If no active flash sale was found, treat everything as regular price.
  }

  // 6️⃣  Upsert cart item
  let cartItem: CartItem;

  if (existing) {
    const newTotalFlash = (existing.flashQuantity ?? 0) + newFlashQtyForThisAdd;

    cartItem = await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: totalQtyAfterAdd,
        flashQuantity: newTotalFlash,
        // Only lock in priceOverride if we actually have flash units
        ...(resolvedPriceOverride != null
          ? { priceOverride: resolvedPriceOverride }
          : {}),
      },
    });
  } else {
    cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        medicineId,
        quantity,
        priceOverride: resolvedPriceOverride,
        flashQuantity: newFlashQtyForThisAdd,
      },
    });
  }

  return cartItem;
};

// ─────────────────────────────────────────────────────────────────────────────
// getMedicineCartStatus
// ─────────────────────────────────────────────────────────────────────────────
const getMedicineCartStatus = async (userId: string, medicineId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart) return { inCart: false, quantity: 0 };

  const cartItem = cart.items.find((item) => item.medicineId === medicineId);
  if (!cartItem) return { inCart: false, quantity: 0 };

  return { inCart: true, quantity: cartItem.quantity };
};

// ─────────────────────────────────────────────────────────────────────────────
// getFromCartService
//
// Price calculation per item:
//   • flashQuantity units  → priceOverride (flash price)
//   • remaining units      → medicine.price (regular price)
// ─────────────────────────────────────────────────────────────────────────────
const getFromCartService = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { medicine: true },
      },
    },
  });

  if (!cart) return { items: [], totalQuantity: 0, totalPrice: 0 };

  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cart.items.reduce((sum, item) => {
    const flashQty = item.flashQuantity ?? 0;
    const regularQty = item.quantity - flashQty;
    const flashPrice = item.priceOverride ?? item.medicine.price;

    return sum + flashQty * flashPrice + regularQty * item.medicine.price;
  }, 0);

  return { items: cart.items, totalQuantity, totalPrice };
};

// ─────────────────────────────────────────────────────────────────────────────
// updateCartItemService
//
// When a customer changes the quantity of a cart item already in the cart:
//   • Re-validate against total stock
//   • Recalculate how many of the new quantity can still be at flash price
// ─────────────────────────────────────────────────────────────────────────────
const updateCartItemService = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  if (quantity < 1) throw new AppError(status.BAD_REQUEST, "Quantity must be at least 1");

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { medicine: true },
  });
  if (!cartItem) throw new AppError(status.NOT_FOUND, "Cart item not found");

  // Stock check
  if (quantity > cartItem.medicine.stock) {
    throw new AppError(
      status.BAD_REQUEST,
      `Only ${cartItem.medicine.stock} unit(s) available in stock`
    );
  }

  // Recalculate flash quantity for the new quantity
  let newFlashQty = 0;

  if (cartItem.priceOverride != null) {
    const flashSale = await findActiveFlashSale(cartItem.medicineId);

    if (flashSale) {
      // soldCount = units already SOLD via placed orders only (cart reservations are NOT counted).
      // saleStock - soldCount = total flash slots still available globally.
      // This cart's existing flashQuantity is already within those slots — do NOT add it back.
      const flashSlotsAvailable = flashSale.saleStock - flashSale.soldCount;
      newFlashQty = Math.min(quantity, Math.max(0, flashSlotsAvailable));
    }
    // If flash sale has expired → newFlashQty stays 0 (all units revert to regular price)
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      quantity,
      flashQuantity: newFlashQty,
    },
    include: { medicine: true },
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────────────────────
// removeCartItemService
// ─────────────────────────────────────────────────────────────────────────────
const removeCartItemService = async (userId: string, itemId: string) => {
  const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!cartItem) throw new AppError(status.NOT_FOUND, "Cart item not found");

  const cart = await prisma.cart.findUnique({ where: { id: cartItem.cartId } });
  if (!cart || cart.userId !== userId) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  await prisma.cartItem.delete({ where: { id: itemId } });
  return { success: true, message: "Cart item removed successfully" };
};

// ─────────────────────────────────────────────────────────────────────────────
// clearCartService
// ─────────────────────────────────────────────────────────────────────────────
const clearCartService = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return { success: true };
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return { success: true, message: "Cart cleared" };
};

export const cartService = {
  addToCartService,
  getMedicineCartStatus,
  getFromCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
};