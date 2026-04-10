import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Get all sub-orders for a seller ─────────────────────────────────────────
const getSellerSubOrders = async (sellerId: string) => {
  return prisma.subOrder.findMany({
    where: { sellerId },
    include: {
      order: {
        select: {
          id: true,
          address: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      },
      items: {
        include: {
          medicine: { select: { id: true, name: true, price: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Get sub-orders for a customer's order ────────────────────────────────────
const getOrderSubOrders = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new AppError(status.NOT_FOUND, "Order not found");

  return prisma.subOrder.findMany({
    where: { orderId },
    include: {
      seller: { select: { name: true, email: true } },
      items: {
        include: {
          medicine: { select: { id: true, name: true, price: true, image: true } },
        },
      },
    },
  });
};

// ─── Update sub-order status (seller) ────────────────────────────────────────
const updateSubOrderStatus = async (
  id: string,
  sellerId: string,
  orderStatus: string
) => {
  const sub = await prisma.subOrder.findFirst({ where: { id, sellerId } });
  if (!sub) throw new AppError(status.NOT_FOUND, "Sub-order not found");

  return prisma.subOrder.update({
    where: { id },
    data: { status: orderStatus as any },
  });
};

export const subOrderService = {
  getSellerSubOrders,
  getOrderSubOrders,
  updateSubOrderStatus,
};
