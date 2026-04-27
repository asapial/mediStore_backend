import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { extractCoordsFromBDAddress, haversineKm } from "../../utils/bdGeo";

// ─── Pick nearest active warehouse to a Bangladesh delivery address ───────────
async function getNearestWarehouseToAddress(deliveryAddress: string) {
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!warehouses.length) {
    throw new AppError(status.SERVICE_UNAVAILABLE, "No active warehouse available. Contact admin.");
  }

  if (warehouses.length === 1) return warehouses[0]!;

  const coords = extractCoordsFromBDAddress(deliveryAddress);
  if (!coords) {
    console.warn(`[warehouse-assign] Could not resolve coords for: "${deliveryAddress}" — assigning ${warehouses[0]!.name}`);
    return warehouses[0]!;
  }

  const nearest = warehouses.reduce((best, wh) => {
    const distBest = haversineKm(coords.lat, coords.lng, best.lat, best.lng);
    const distWh   = haversineKm(coords.lat, coords.lng, wh.lat,   wh.lng);
    return distWh < distBest ? wh : best;
  });

  const finalDist = haversineKm(coords.lat, coords.lng, nearest.lat, nearest.lng);
  console.info(`[warehouse-assign] "${deliveryAddress}" → ${nearest.name} (${nearest.city}) — ${finalDist.toFixed(1)} km`);
  return nearest;
}

// ─── Shared: create FulfillmentTask for an order (idempotent) ────────────────
export async function ensureFulfillmentTask(orderId: string) {
  const existing = await prisma.fulfillmentTask.findUnique({ where: { orderId } });
  if (existing) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { address: true },
  });
  const deliveryAddress = order?.address ?? "";
  const warehouse = await getNearestWarehouseToAddress(deliveryAddress);

  const task = await prisma.fulfillmentTask.create({
    data: { orderId, warehouseId: warehouse.id, status: "PENDING" },
  });

  // Only update order to PROCESSING if still in initial state (prevent regression from SHIPPED→PROCESSING)
  await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["PLACED", "CONFIRMED"] } },
    data:  { status: "PROCESSING" },
  });
  await prisma.orderTracking.create({
    data: {
      orderId,
      status: "CONFIRMED",
      note:   `Order is being processed at ${warehouse.name} (${warehouse.city}). Packages are being consolidated.`,
    },
  });

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
      shipmentLeg: {
        select: {
          id: true, status: true,
          originWarehouse: { select: { id: true, name: true, city: true } },
          destWarehouse:   { select: { id: true, name: true, city: true } },
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
      shipmentLeg: {
        select: {
          id: true, status: true,
          arrivedAtOriginAt: true, dispatchedAt: true, arrivedAtDestAt: true,
          originWarehouse: { select: { id: true, name: true, city: true } },
          destWarehouse:   { select: { id: true, name: true, city: true } },
        },
      },
    },
  });
};

// ─── Update sub-order status (seller action) ──────────────────────────────────
const updateSubOrderStatus = async (id: string, sellerId: string, orderStatus: string) => {
  const sub = await prisma.subOrder.findFirst({ where: { id, sellerId } });
  if (!sub) throw new AppError(status.NOT_FOUND, "Sub-order not found");

  const updated = await prisma.subOrder.update({
    where: { id },
    data: { status: orderStatus as any },
  });

  // ── When seller marks SHIPPED: update ShipmentLeg + check all-shipped ───────
  if (orderStatus === "SHIPPED") {
    // Advance this SubOrder's ShipmentLeg so the origin WH can receive the items
    await prisma.shipmentLeg.updateMany({
      where: { subOrderId: id, status: "SELLER_PREPARING" },
      data:  { status: "AWAITING_ORIGIN_WH" },
    });

    // ✅ Always call ensureFulfillmentTask on EVERY seller-ship (idempotent).
    // Previously this only fired when ALL sellers had shipped, causing the task
    // to never appear until the last seller acted. The warehouse routing flow
    // (receiveAtDest) also calls this — the upsert guard prevents duplicates.
    await ensureFulfillmentTask(sub.orderId);
  }

  return updated;
};

export const subOrderService = {
  getSellerSubOrders,
  getOrderSubOrders,
  updateSubOrderStatus,
};
