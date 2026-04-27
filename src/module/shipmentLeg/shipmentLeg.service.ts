import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ensureFulfillmentTask } from "../subOrder/subOrder.service";

// ─── List legs where this warehouse is the ORIGIN or DESTINATION ──────────────
const getLegsForWarehouse = (warehouseId: string) =>
  prisma.shipmentLeg.findMany({
    where: {
      OR: [
        { originWarehouseId: warehouseId },
        { destWarehouseId:   warehouseId },
      ],
    },
    include: {
      subOrder: {
        include: {
          seller:  { select: { id: true, name: true, email: true } },
          items:   { include: { medicine: { select: { id: true, name: true, image: true } } } },
        },
      },
      order:           { select: { id: true, address: true, user: { select: { name: true, email: true } } } },
      originWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } },
      destWarehouse:   { select: { id: true, name: true, city: true, address: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

// ─── Auto-resolve warehouse from authenticated user ───────────────────────────
const getLegsForUser = async (userId: string) => {
  // ADMIN: see everything
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === "ADMIN") return getAllLegs();

  // WAREHOUSE: find their managed warehouse(s) and return legs for each
  const warehouses = await prisma.warehouse.findMany({
    where: { managerId: userId },
    select: { id: true },
  });
  if (!warehouses.length) return [];

  const warehouseIds = warehouses.map((w) => w.id);
  return prisma.shipmentLeg.findMany({
    where: {
      OR: [
        { originWarehouseId: { in: warehouseIds } },
        { destWarehouseId:   { in: warehouseIds } },
      ],
    },
    include: {
      subOrder: {
        include: {
          seller:  { select: { id: true, name: true, email: true } },
          items:   { include: { medicine: { select: { id: true, name: true, image: true } } } },
        },
      },
      order:           { select: { id: true, address: true, user: { select: { name: true, email: true } } } },
      originWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } },
      destWarehouse:   { select: { id: true, name: true, city: true, address: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: list all legs ─────────────────────────────────────────────────────
const getAllLegs = (filterStatus?: string) =>
  prisma.shipmentLeg.findMany({
    ...(filterStatus ? { where: { status: filterStatus as any } } : {}),
    include: {
      subOrder: {
        include: {
          seller:  { select: { id: true, name: true } },
          items:   { select: { quantity: true, price: true } },
        },
      },
      order:           { select: { id: true, address: true } },
      originWarehouse: { select: { id: true, name: true, city: true } },
      destWarehouse:   { select: { id: true, name: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

// ─── BUG FIX: ensure task exists when ANY leg arrives — never auto-set READY ──
// OLD: checkAndAdvanceToReady only created the task when ALL legs were AT_DEST_WH
//      and then immediately jumped to READY, skipping CONSOLIDATING entirely.
// NEW: Create the task as soon as the FIRST leg arrives. Status progression
//      (PENDING → CONSOLIDATING → PICKED) is driven exclusively by the
//      fulfillment worker calling receiveSellerItems() for each package.
async function ensureTaskOnLegArrival(orderId: string) {
  await ensureFulfillmentTask(orderId);
  // ✋ NEVER set READY here. Workers drive the status manually.
}

// ─── Origin WH confirms receipt from seller ──────────────────────────────────
const receiveAtOrigin = async (legId: string) => {
  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId } });
  if (!leg) throw new AppError(status.NOT_FOUND, "Shipment leg not found");
  if (leg.status !== "AWAITING_ORIGIN_WH")
    throw new AppError(status.BAD_REQUEST, `Cannot receive: current status is ${leg.status}`);

  const sameWarehouse = leg.originWarehouseId === leg.destWarehouseId;

  const updated = await prisma.shipmentLeg.update({
    where: { id: legId },
    data: {
      // If origin == dest, skip IN_TRANSIT and go straight to AT_DEST_WH
      status:            sameWarehouse ? "AT_DEST_WH" : "AT_ORIGIN_WH",
      arrivedAtOriginAt: new Date(),
      ...(sameWarehouse ? { arrivedAtDestAt: new Date() } : {}),
    },
  });

  // For same-WH: package is physically at dest — ensure task is visible immediately
  if (sameWarehouse) {
    await ensureTaskOnLegArrival(leg.orderId);
  }

  return { leg: updated };
};

// ─── Origin WH dispatches to destination WH ──────────────────────────────────
const dispatchToDestination = async (legId: string) => {
  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId } });
  if (!leg) throw new AppError(status.NOT_FOUND, "Shipment leg not found");
  if (leg.status !== "AT_ORIGIN_WH")
    throw new AppError(status.BAD_REQUEST, `Cannot dispatch: current status is ${leg.status}`);

  return prisma.shipmentLeg.update({
    where: { id: legId },
    data:  { status: "IN_TRANSIT", dispatchedAt: new Date() },
  });
};

// ─── Dest WH confirms arrival + check if all legs ready → advance task ────────
const receiveAtDest = async (legId: string) => {
  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId } });
  if (!leg) throw new AppError(status.NOT_FOUND, "Shipment leg not found");
  if (!["IN_TRANSIT", "AT_ORIGIN_WH"].includes(leg.status))
    throw new AppError(status.BAD_REQUEST, `Cannot receive at dest: current status is ${leg.status}`);

  const updated = await prisma.shipmentLeg.update({
    where: { id: legId },
    data:  { status: "AT_DEST_WH", arrivedAtDestAt: new Date() },
  });

  // BUG FIX: ALWAYS create the task when ANY leg arrives — not only when all legs
  // are AT_DEST_WH. This means the fulfillment worker sees the order immediately
  // and can start staging packages as they arrive one by one.
  await ensureTaskOnLegArrival(leg.orderId);

  return { leg: updated };
};

export const shipmentLegService = {
  getLegsForWarehouse,
  getLegsForUser,
  getAllLegs,
  receiveAtOrigin,
  dispatchToDestination,
  receiveAtDest,
};
