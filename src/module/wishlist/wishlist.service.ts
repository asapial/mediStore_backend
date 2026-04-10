import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Get or create wishlist ───────────────────────────────────────────────────
const getOrCreate = async (userId: string) => {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              stock: true,
              manufacturer: true,
              seller: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
      include: { items: { include: { medicine: { select: { id: true, name: true, price: true, image: true, stock: true, manufacturer: true, seller: { select: { name: true } }, category: { select: { name: true } } } } } } },
    });
  }
  return wishlist;
};

// ─── Add item ─────────────────────────────────────────────────────────────────
const addItem = async (userId: string, medicineId: string) => {
  const wishlist = await getOrCreate(userId);

  const exists = await prisma.wishlistItem.findUnique({
    where: { wishlistId_medicineId: { wishlistId: wishlist.id, medicineId } },
  });
  if (exists) throw new AppError(status.CONFLICT, "Item already in wishlist");

  return prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, medicineId },
    include: {
      medicine: {
        select: { id: true, name: true, price: true, image: true, stock: true },
      },
    },
  });
};

// ─── Remove item ──────────────────────────────────────────────────────────────
const removeItem = async (userId: string, medicineId: string) => {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) throw new AppError(status.NOT_FOUND, "Wishlist not found");

  const item = await prisma.wishlistItem.findUnique({
    where: { wishlistId_medicineId: { wishlistId: wishlist.id, medicineId } },
  });
  if (!item) throw new AppError(status.NOT_FOUND, "Item not in wishlist");

  return prisma.wishlistItem.delete({
    where: { wishlistId_medicineId: { wishlistId: wishlist.id, medicineId } },
  });
};

// ─── Clear all ────────────────────────────────────────────────────────────────
const clearWishlist = async (userId: string) => {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return;
  return prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
};

export const wishlistService = {
  getOrCreate,
  addItem,
  removeItem,
  clearWishlist,
};
