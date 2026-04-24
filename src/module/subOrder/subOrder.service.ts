import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Helper: get or create a default warehouse ───────────────────────────────
// Ensures FulfillmentTask creation never fails due to missing warehouse
async function getOrCreateDefaultWarehouse() {
  // 1. Try active warehouse first
  let warehouse = await prisma.warehouse.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  // 2. Fall back to ANY warehouse
  if (!warehouse) {
    warehouse = await prisma.warehouse.findFirst({ orderBy: { createdAt: "asc" } });
  }
  // 3. Auto-create a default warehouse so the flow never silently breaks
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { name: "Main Warehouse", isActive: true },
    });
  }
  return warehouse;
}

// ─── Shared: create FulfillmentTask for an order (idempotent) ────────────────
export async function ensureFulfillmentTask(orderId: string) {
  const existing = await prisma.fulfillmentTask.findUnique({ where: { orderId } });
  if (existing) return existing;

  const warehouse = await getOrCreateDefaultWarehouse();

  const task = await prisma.fulfillmentTask.create({
    data: { orderId, warehouseId: warehouse.id, status: "PENDING" },
  });

  await prisma.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } });

  return task;
}

// ─── Get all sub-orders for a seller ─────────────────────────────────────────
const getSellerSubOrders = async (sellerId: string) => {
  return prisma.subOrder.findMany({
    where: { sellerId },
    include: {
      order: {
        select: {
          id: true, address: true, createdAt: true, status: true,
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
const updateSubOrderStatus = async (id: string, sellerId: string, orderStatus: string) => {
  const sub = await prisma.subOrder.findFirst({ where: { id, sellerId } });
  if (!sub) throw new AppError(status.NOT_FOUND, "Sub-order not found");

  const updated = await prisma.subOrder.update({
    where: { id },
    data: { status: orderStatus as any },
  });

  // ── When seller marks SHIPPED: check if ALL sub-orders for this order are SHIPPED ──
  if (orderStatus === "SHIPPED") {
    const allSubOrders = await prisma.subOrder.findMany({ where: { orderId: sub.orderId } });

    // Treat current sub-order as already updated
    const allShipped = allSubOrders.every((s) => (s.id === id ? true : s.status === "SHIPPED"));

    if (allShipped) {
      // ensureFulfillmentTask auto-creates a warehouse if none exists
      await ensureFulfillmentTask(sub.orderId);
    }
  }

  return updated;
};

export const subOrderService = {
  getSellerSubOrders,
  getOrderSubOrders,
  updateSubOrderStatus,
};
