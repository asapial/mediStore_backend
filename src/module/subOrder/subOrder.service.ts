import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Geocode a free-text address via OpenStreetMap Nominatim ─────────────────
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=bd`;
    const res  = await fetch(url, {
      headers: { "User-Agent": "MediStore/1.0 (warehouse-auto-assign)" },
    });
    if (!res.ok) return null;
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ─── Pick nearest warehouse to a delivery address ────────────────────────────
async function getNearestWarehouseToAddress(deliveryAddress: string) {
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!warehouses.length) {
    // Auto-create a placeholder so the flow never silently breaks
    return prisma.warehouse.create({
      data: { name: "Main Warehouse", address: "Dhaka", city: "Dhaka", lat: 23.8103, lng: 90.4125, managerId: (await prisma.user.findFirst({ where: { role: "WAREHOUSE" } }))!.id },
    });
  }

  // Try geocoding — if it fails, just pick the first active warehouse
  const coords = await geocodeAddress(deliveryAddress);
  if (!coords) {
    console.warn(`[warehouse-assign] Geocoding failed for "${deliveryAddress}" — using first active warehouse`);
    return warehouses[0];
  }

  // Pick warehouse with minimum Haversine distance to the customer
  let nearest = warehouses[0];
  let minDist  = haversine(coords.lat, coords.lng, nearest.lat, nearest.lng);

  for (const wh of warehouses.slice(1)) {
    const dist = haversine(coords.lat, coords.lng, wh.lat, wh.lng);
    if (dist < minDist) { minDist = dist; nearest = wh; }
  }

  console.info(`[warehouse-assign] "${deliveryAddress}" → nearest: ${nearest.name} (${nearest.city}) — ${minDist.toFixed(1)} km away`);
  return nearest;
}

// ─── Shared: create FulfillmentTask for an order (idempotent) ────────────────
export async function ensureFulfillmentTask(orderId: string) {
  const existing = await prisma.fulfillmentTask.findUnique({ where: { orderId } });
  if (existing) return existing;

  // Fetch the order's delivery address to find the nearest warehouse
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { address: true } });
  const deliveryAddress = order?.address ?? "";

  const warehouse = await getNearestWarehouseToAddress(deliveryAddress);

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
