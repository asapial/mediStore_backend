import { TransactionType } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Get queue by warehouseId (all statuses) ─────────────────────────────────
const getQueue = (warehouseId: string) =>
  prisma.fulfillmentTask.findMany({
    where: { warehouseId },
    include: {
      order: {
        include: {
          items:     { include: { medicine: { select: { id: true, name: true, image: true } } } },
          user:      { select: { id: true, name: true, email: true } },
          subOrders: { include: { seller: { select: { id: true, name: true } } } },
        },
      },
      assignedTo:  { select: { id: true, name: true } },
      packingSlip: true,
    },
    orderBy: { createdAt: "asc" },
  });

// ─── Get queue for the current user (any WAREHOUSE user sees ALL tasks) ───────
const getMyQueue = async (_userId: string) => {
  return prisma.fulfillmentTask.findMany({
    where: {}, // Show ALL tasks to any warehouse user
    include: {
      order: {
        include: {
          items:     { include: { medicine: { select: { id: true, name: true, image: true } } } },
          user:      { select: { id: true, name: true, email: true } },
          subOrders: {
            include: {
              seller: { select: { id: true, name: true } },
              // Include items so frontend can compute correct seller totals
              // (subOrder.total may be 0 for legacy orders)
              items:  { select: { price: true, quantity: true } },
            },
          },
        },
      },
      warehouse:   { select: { id: true, name: true } },
      assignedTo:  { select: { id: true, name: true } },
      packingSlip: true,
    },
    orderBy: { createdAt: "asc" },
  });
};

// ─── Assign / start picking ───────────────────────────────────────────────────
const assignTask = async (orderId: string, warehouseId: string, assignedToId: string) => {
  const existing = await prisma.fulfillmentTask.findUnique({ where: { orderId } });
  if (existing) {
    return prisma.fulfillmentTask.update({
      where: { orderId },
      data: { warehouseId, assignedToId, status: "PICKED", startedAt: new Date() },
    });
  }
  return prisma.fulfillmentTask.create({
    data: { orderId, warehouseId, assignedToId, status: "PICKED", startedAt: new Date() },
  });
};

// ─── Mark individual seller shipment received at warehouse ────────────────────
// Tracked inside PackingSlip.items JSON: { receivedSubOrderIds: string[] }
const receiveSellerItems = async (taskId: string, subOrderId: string, userId: string) => {
  const task = await prisma.fulfillmentTask.findUnique({
    where: { id: taskId },
    include: {
      order:       { include: { subOrders: { select: { id: true } } } },
      packingSlip: true,
    },
  });
  if (!task) throw new AppError(status.NOT_FOUND, "Task not found");

  // Build / update received list inside PackingSlip.items JSON
  const currentData = (task.packingSlip?.items as any) ?? { receivedSubOrderIds: [] };
  const received: string[] = Array.isArray(currentData.receivedSubOrderIds)
    ? currentData.receivedSubOrderIds
    : [];
  if (!received.includes(subOrderId)) received.push(subOrderId);
  const newItems = { ...currentData, receivedSubOrderIds: received };

  // packedBy: the warehouse worker receiving the goods
  const packedBy = task.assignedToId ?? userId;

  let slip;
  if (task.packingSlip) {
    slip = await prisma.packingSlip.update({
      where: { id: task.packingSlip.id },
      data: { items: newItems },
    });
  } else {
    slip = await prisma.packingSlip.create({
      data: { fulfillmentTaskId: taskId, packedBy, items: newItems },
    });
    // Auto-start picking if task is still PENDING
    if (task.status === "PENDING") {
      await prisma.fulfillmentTask.update({
        where: { id: taskId },
        data: { status: "PICKED", assignedToId: userId, startedAt: new Date() },
      });
    }
  }

  const allIds = task.order.subOrders.map((s) => s.id);
  const allReceived = allIds.every((id) => received.includes(id));

  return {
    slip,
    receivedSubOrderIds: received,
    allReceived,
    receivedCount: received.length,
    totalCount:    allIds.length,
  };
};

// ─── Pack task ────────────────────────────────────────────────────────────────
const packTask = async (taskId: string, packedBy: string, items: object[]) => {
  const task = await prisma.fulfillmentTask.findUnique({
    where: { id: taskId },
    include: { packingSlip: true },
  });
  if (!task) throw new AppError(status.NOT_FOUND, "Task not found");

  await prisma.fulfillmentTask.update({
    where: { id: taskId },
    data: { status: "PACKED", packedAt: new Date() },
  });

  const existingSlip = task.packingSlip;
  const existingData = (existingSlip?.items as any) ?? {};
  const newItems = { ...existingData, packedBy, packedItems: items };

  if (existingSlip) {
    return prisma.packingSlip.update({
      where: { id: existingSlip.id },
      data: { packedBy, items: newItems },
    });
  }
  return prisma.packingSlip.create({
    data: { fulfillmentTaskId: taskId, packedBy, items: newItems },
  });
};

// ─── Dispatch task → Order becomes SHIPPED ────────────────────────────────────
const dispatchTask = async (taskId: string) => {
  const task = await prisma.fulfillmentTask.findUnique({ where: { id: taskId } });
  if (!task) throw new AppError(status.NOT_FOUND, "Task not found");
  if (task.status !== "PACKED")
    throw new AppError(status.BAD_REQUEST, "Task must be PACKED before dispatch");

  await prisma.order.update({
    where: { id: task.orderId },
    data:  { status: "SHIPPED" },
  });

  return prisma.fulfillmentTask.update({
    where: { id: taskId },
    data: { status: "DISPATCHED", dispatchedAt: new Date() },
  });
};

// ─── Mark delivered → credits seller wallets ──────────────────────────────────
const markDelivered = async (taskId: string) => {
  const task = await prisma.fulfillmentTask.findUnique({
    where: { id: taskId },
    include: {
      order: {
        include: {
          // Include items so we can compute per-seller totals accurately
          // (subOrder.total may be 0 for legacy orders)
          subOrders: {
            include: { items: { select: { price: true, quantity: true } } },
          },
        },
      },
    },
  });

  if (!task) throw new AppError(status.NOT_FOUND, "Task not found");
  if (task.status !== "DISPATCHED")
    throw new AppError(status.BAD_REQUEST, "Task must be DISPATCHED before marking delivered");

  await prisma.$transaction(async (tx) => {
    // ── 1. Update FulfillmentTask itself ─────────────────────────────────────
    await tx.fulfillmentTask.update({
      where: { id: taskId },
      data:  { status: "DELIVERED" },
    });

    // ── 2. Update Order + SubOrders + Items ──────────────────────────────────
    await tx.order.update({ where: { id: task.orderId }, data: { status: "DELIVERED" } });
    await tx.subOrder.updateMany({ where: { orderId: task.orderId }, data: { status: "DELIVERED" } });
    await tx.orderItem.updateMany({ where: { orderId: task.orderId }, data: { status: "DELIVERED" } });

    await tx.orderTracking.create({
      data: {
        orderId: task.orderId,
        status:  "DELIVERED",
        note:    "Package delivered to customer. Seller earnings credited.",
      },
    });

    // ── 3. Credit each seller's wallet ───────────────────────────────────────
    for (const subOrder of task.order.subOrders) {
      // Compute from actual items (works for new orders with subOrderId set)
      // Fall back to subOrder.total for legacy orders where items may not be linked
      const fromItems = subOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
      const computedTotal = fromItems > 0 ? fromItems : subOrder.total;
      if (computedTotal <= 0) continue;

      let wallet = await tx.wallet.findUnique({ where: { userId: subOrder.sellerId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: subOrder.sellerId, balance: 0 } });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data:  { balance: { increment: computedTotal } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId:    wallet.id,
          amount:      computedTotal,
          type:        TransactionType.DEPOSIT,
          description: `Order #${task.orderId.slice(-8).toUpperCase()} delivered — ৳${computedTotal.toFixed(2)} credited`,
        },
      });
    }
  });

  return { message: "Delivered. Seller wallets credited.", orderId: task.orderId };
};

// ─── Get single task ──────────────────────────────────────────────────────────
const getTask = (taskId: string) =>
  prisma.fulfillmentTask.findUnique({
    where: { id: taskId },
    include: {
      order: {
        include: {
          items:     { include: { medicine: true } },
          user:      { select: { id: true, name: true } },
          subOrders: { include: { seller: { select: { id: true, name: true } } } },
        },
      },
      assignedTo:  { select: { id: true, name: true } },
      packingSlip: true,
    },
  });

export const fulfillmentService = {
  getQueue,
  getMyQueue,
  assignTask,
  receiveSellerItems,
  packTask,
  dispatchTask,
  markDelivered,
  getTask,
};
