import { TransactionType } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Get queue by warehouseId (all statuses) ──────────────────────────────────
const getQueue = (warehouseId: string) =>
  prisma.fulfillmentTask.findMany({
    where: { warehouseId },
    include: {
      order: {
        include: {
          items:     { include: { medicine: { select: { id: true, name: true, image: true } } } },
          user:      { select: { id: true, name: true, email: true } },
          subOrders: { include: { seller: { select: { id: true, name: true } } } },
          tracking:  { orderBy: { createdAt: "asc" } },
        },
      },
      assignedTo:  { select: { id: true, name: true } },
      packingSlip: true,
    },
    orderBy: { createdAt: "asc" },
  });

// ─── Get queue for the current user ───────────────────────────────────────────
const getMyQueue = async (_userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: _userId },
    select: { role: true },
  });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  const where: any = {};
  if (user.role !== "ADMIN") {
    const managedWarehouses = await prisma.warehouse.findMany({
      where: { managerId: _userId },
      select: { id: true },
    });
    if (managedWarehouses.length === 0) return [];
    where.warehouseId = { in: managedWarehouses.map((w) => w.id) };
  }

  return prisma.fulfillmentTask.findMany({
    where,
    include: {
      order: {
        include: {
          items:     { include: { medicine: { select: { id: true, name: true, image: true } } } },
          user:      { select: { id: true, name: true, email: true } },
          subOrders: {
            include: {
              seller: { select: { id: true, name: true } },
              items:  { select: { price: true, quantity: true } },
              // ✅ Include stagedAt so UI can show per-seller staging progress
              shipmentLeg: {
                select: {
                  id:               true,
                  status:           true,
                  stagedAt:         true,
                  arrivedAtDestAt:  true,
                  originWarehouse:  { select: { name: true, city: true } },
                },
              },
            },
          },
          tracking: { orderBy: { createdAt: "asc" } },
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
// Status guard: only PENDING or READY may be manually picked.
// CONSOLIDATING tasks are automatically advanced via receiveSellerItems.
const assignTask = async (orderId: string, warehouseId: string, assignedToId: string) => {
  const existing = await prisma.fulfillmentTask.findUnique({ where: { orderId } });

  if (existing) {
    if (!["PENDING", "READY"].includes(existing.status)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Cannot assign task: current status is ${existing.status}. Task must be PENDING or READY.`
      );
    }
    return prisma.fulfillmentTask.update({
      where: { orderId },
      data: { warehouseId, assignedToId, status: "PICKED", startedAt: new Date() },
    });
  }

  return prisma.fulfillmentTask.create({
    data: { orderId, warehouseId, assignedToId, status: "PICKED", startedAt: new Date() },
  });
};

// ─── Stage individual seller shipment at dest warehouse ───────────────────────
// Called from the Fulfillment page when a worker physically receives a seller's box.
// Drives: PENDING → CONSOLIDATING → PICKED
const receiveSellerItems = async (taskId: string, subOrderId: string, userId: string) => {
  const task = await prisma.fulfillmentTask.findUnique({
    where: { id: taskId },
    include: {
      order:       { include: { subOrders: { select: { id: true } } } },
      packingSlip: true,
    },
  });
  if (!task) throw new AppError(status.NOT_FOUND, "Task not found");

  // ── Guard: leg MUST be AT_DEST_WH before a worker can stage it ──────────
  // (The routing tab "Confirm Arrival" step sets AT_DEST_WH. Staging before
  //  that point would be physically impossible — the package isn't here yet.)
  const leg = await prisma.shipmentLeg.findFirst({
    where: { subOrderId },
    orderBy: { createdAt: "desc" },
  });
  if (!leg) throw new AppError(status.NOT_FOUND, "Shipment leg not found for this sub-order");
  if (leg.status !== "AT_DEST_WH") {
    throw new AppError(
      status.BAD_REQUEST,
      `Cannot stage: package has not arrived at the destination warehouse yet (leg status: ${leg.status}). Complete the routing steps first.`
    );
  }

  // ── Stamp stagedAt on the leg (status stays AT_DEST_WH) ──────────────────
  await prisma.shipmentLeg.update({
    where: { id: leg.id },
    data: { stagedAt: new Date() },
  });

  // ── Build / update received list inside PackingSlip.items JSON ────────────
  const currentData = (task.packingSlip?.items as any) ?? { receivedSubOrderIds: [] };
  const received: string[] = Array.isArray(currentData.receivedSubOrderIds)
    ? currentData.receivedSubOrderIds : [];
  if (!received.includes(subOrderId)) received.push(subOrderId);
  const newItems = { ...currentData, receivedSubOrderIds: received };
  const packedBy = task.assignedToId ?? userId;

  // ── Upsert the PackingSlip (atomic — no race condition on concurrent staging) ──
  const slip = await prisma.packingSlip.upsert({
    where:  { fulfillmentTaskId: taskId },
    update: { items: newItems },
    create: { fulfillmentTaskId: taskId, packedBy, items: newItems },
  });

  // ── Drive FulfillmentTask status based on staging progress ───────────────
  const allIds      = task.order.subOrders.map((s) => s.id);
  const allReceived = allIds.every((id) => received.includes(id));

  if (allReceived) {
    // All sellers staged → PICKED (ready to pack)
    await prisma.fulfillmentTask.update({
      where: { id: taskId },
      data:  { status: "PICKED", assignedToId: userId, startedAt: task.startedAt ?? new Date() },
    });
  } else if (["PENDING", "READY", "CONSOLIDATING"].includes(task.status)) {
    // First (or subsequent) item staged but more expected → CONSOLIDATING
    // ✅ FIX: CONSOLIDATING must also be listed here so that a second-seller
    //    receipt correctly stays CONSOLIDATING (and doesn't skip to PICKED prematurely).
    await prisma.fulfillmentTask.update({
      where: { id: taskId },
      data:  { status: "CONSOLIDATING", assignedToId: userId, startedAt: task.startedAt ?? new Date() },
    });
  }

  return {
    slip,
    receivedSubOrderIds: received,
    allReceived,
    receivedCount: received.length,
    totalCount:    allIds.length,
  };
};

// ─── Pack task ────────────────────────────────────────────────────────────────
// Only PICKED tasks (all sub-orders staged) may be packed.
// CONSOLIDATING is explicitly rejected with a clear message.
const packTask = async (taskId: string, packedBy: string, items: object[]) => {
  const task = await prisma.fulfillmentTask.findUnique({
    where: { id: taskId },
    include: { packingSlip: true },
  });
  if (!task) throw new AppError(status.NOT_FOUND, "Task not found");

  if (task.status === "CONSOLIDATING") {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot pack yet — waiting for remaining seller packages to be staged."
    );
  }
  if (!["PICKED", "READY"].includes(task.status)) {
    throw new AppError(
      status.BAD_REQUEST,
      `Cannot pack task: current status is ${task.status}. Task must be PICKED or READY.`
    );
  }

  await prisma.fulfillmentTask.update({
    where: { id: taskId },
    data:  { status: "PACKED", packedAt: new Date() },
  });

  const existingSlip = task.packingSlip;
  const existingData = (existingSlip?.items as any) ?? {};
  const newItems     = { ...existingData, packedBy, packedItems: items };

  if (existingSlip) {
    return prisma.packingSlip.update({
      where: { id: existingSlip.id },
      data:  { packedBy, items: newItems },
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

  await prisma.orderTracking.create({
    data: {
      orderId: task.orderId,
      status:  "SHIPPED",
      note:    "Package dispatched from warehouse. Out for final-mile delivery.",
    },
  });

  return prisma.fulfillmentTask.update({
    where: { id: taskId },
    data:  { status: "DISPATCHED", dispatchedAt: new Date() },
  });
};

// ─── Mark delivered → credits seller wallets + notifies customer ──────────────
const markDelivered = async (taskId: string) => {
  const task = await prisma.fulfillmentTask.findUnique({
    where: { id: taskId },
    include: {
      order: {
        include: {
          user: { select: { id: true, name: true } },
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
    await tx.fulfillmentTask.update({
      where: { id: taskId },
      data:  { status: "DELIVERED" },
    });

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

    for (const subOrder of task.order.subOrders) {
      const fromItems     = subOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
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

    await tx.notification.create({
      data: {
        userId: task.order.user.id,
        type:   "ORDER_UPDATE",
        title:  "Your order has been delivered! 🎉",
        body:   `Order #${task.orderId.slice(-8).toUpperCase()} has been successfully delivered to your address.`,
      },
    });
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
          subOrders: {
            include: {
              seller:      { select: { id: true, name: true } },
              shipmentLeg: { select: { id: true, status: true, stagedAt: true } },
            },
          },
          tracking:  { orderBy: { createdAt: "asc" } },
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
