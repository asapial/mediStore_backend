import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { extractCoordsFromBDAddress, haversineKm } from "../../utils/bdGeo";

// ─── Resolve nearest warehouse from a city/address string ─────────────────────
async function resolveNearestWH(cityOrAddress: string) {
  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true } });
  if (!warehouses.length) return null;
  if (warehouses.length === 1) return { ...warehouses[0]!, distanceKm: "0" };

  const coords = extractCoordsFromBDAddress(cityOrAddress);
  if (!coords) return { ...warehouses[0]!, distanceKm: "?" };

  const nearest = warehouses.reduce((best, wh) =>
    haversineKm(coords.lat, coords.lng, wh.lat, wh.lng) <
    haversineKm(coords.lat, coords.lng, best.lat, best.lng) ? wh : best
  );
  const dist = haversineKm(coords.lat, coords.lng, nearest.lat, nearest.lng);
  return { ...nearest, distanceKm: dist.toFixed(1) };
}

// ─── Compute profile completion per role ──────────────────────────────────────
function computeIsCompletedProfile(
  user: {
    name: string | null;
    phone: string | null;
    image: string | null;
    businessCity: string | null;
    sellerLicense?: { status: string } | null;
  },
  role: string
): boolean {
  const base = !!(user.name && user.phone && user.image);
  if (role === "SELLER") return !!(user.name && user.phone && user.image && user.businessCity);
  return base;
}

// ─── Get full enriched profile for the current user ──────────────────────────
export const getMyProfile = async (userId: string, role: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, image: true, phone: true,
      role: true, businessCity: true,
      createdAt: true, updatedAt: true, isBanned: true,
      wallet:        { select: { id: true, balance: true } },
      sellerLicense: { select: { status: true, licenseNumber: true, documentUrl: true } },
      managedWarehouses: {
        select: {
          id: true, name: true, city: true, address: true,
          phone: true, isActive: true, lat: true, lng: true,
          _count: { select: { locationStocks: true, fulfillmentTasks: true } },
        },
      },
    },
  });

  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  const isCompletedProfile = computeIsCompletedProfile(user, role);
  let extra: Record<string, unknown> = {};

  // ── SELLER ─────────────────────────────────────────────────────────────────
  if (role === "SELLER") {
    const [totalMedicines, totalSubOrders, totalReviews, revenueAgg] = await Promise.all([
      prisma.medicine.count({ where: { sellerId: userId } }),
      prisma.subOrder.count({ where: { sellerId: userId } }),
      prisma.review.count({ where: { medicine: { sellerId: userId } } }),
      prisma.subOrder.aggregate({
        where: { sellerId: userId, status: "DELIVERED" },
        _sum: { total: true },
      }),
    ]);

    const nearestOriginWarehouse = user.businessCity
      ? await resolveNearestWH(user.businessCity)
      : null;

    extra = {
      totalMedicines,
      totalSubOrders,
      totalReviews,
      totalRevenue: revenueAgg._sum.total ?? 0,
      nearestOriginWarehouse,
    };
  }

  // ── CUSTOMER ───────────────────────────────────────────────────────────────
  if (role === "CUSTOMER") {
    const [totalOrders, deliveredOrders, cancelledOrders] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, status: "DELIVERED" } }),
      prisma.order.count({ where: { userId, status: "CANCELLED" } }),
    ]);
    extra = {
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      activeOrders: totalOrders - deliveredOrders - cancelledOrders,
    };
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (role === "ADMIN") {
    const [totalUsers, totalSellers, totalCustomers, totalOrders, totalMedicines, totalWarehouses] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "SELLER" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.order.count(),
        prisma.medicine.count(),
        prisma.warehouse.count({ where: { isActive: true } }),
      ]);
    extra = { totalUsers, totalSellers, totalCustomers, totalOrders, totalMedicines, totalWarehouses };
  }

  // ── WAREHOUSE ──────────────────────────────────────────────────────────────
  if (role === "WAREHOUSE") {
    const warehouse = user.managedWarehouses[0] ?? null;
    if (warehouse) {
      const [lowStock, outOfStock, inboundCount, fulfillCount] = await Promise.all([
        prisma.locationStock.count({
          where: { warehouseId: warehouse.id, quantity: { gt: 0, lte: 10 } },
        }),
        prisma.locationStock.count({
          where: { warehouseId: warehouse.id, quantity: 0 },
        }),
        prisma.shipmentLeg.count({
          where: {
            destWarehouseId: warehouse.id,
            status: { in: ["IN_TRANSIT", "AWAITING_ORIGIN_WH", "AT_ORIGIN_WH"] },
          },
        }),
        prisma.fulfillmentTask.count({
          where: { warehouseId: warehouse.id, status: { not: "DELIVERED" } },
        }),
      ]);
      extra = { warehouseStats: { lowStock, outOfStock, inboundCount, fulfillCount } };
    }
  }

  return { ...user, isCompletedProfile, ...extra };
};

// ─── Update profile — shared across roles ────────────────────────────────────
export const updateMyProfile = async (
  userId: string,
  data: {
    name?: string | undefined;
    image?: string | undefined;
    businessCity?: string | undefined;
    phone?: string | undefined;
  }
) => {
  const updateData: Record<string, unknown> = {};
  if (data.name)                              updateData.name         = data.name;
  if (data.image !== undefined)               updateData.image        = data.image || null;
  if (data.businessCity !== undefined)        updateData.businessCity = data.businessCity || null;
  if (data.phone !== undefined)               updateData.phone        = data.phone || null;

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true, name: true, email: true, image: true, phone: true,
      role: true, businessCity: true, updatedAt: true,
    },
  });
};
