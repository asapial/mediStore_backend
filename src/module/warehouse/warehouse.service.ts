import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// Haversine distance in km
const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const createWarehouse = async (data: {
  name: string; address: string; city: string; lat: number; lng: number;
  managerId: string; phone?: string; country?: string;
}) => {
  // Run inside a transaction: create warehouse + promote manager role atomically.
  // If either step fails, both roll back.
  return prisma.$transaction(async (tx) => {
    // 1. Verify the manager user exists
    const manager = await tx.user.findUnique({ where: { id: data.managerId } });
    if (!manager) throw new AppError(status.NOT_FOUND, "Manager user not found");

    // 2. Create the warehouse
    const warehouse = await tx.warehouse.create({
      data,
      include: { manager: { select: { id: true, name: true, email: true, role: true } } },
    });

    // 3. Promote manager role to WAREHOUSE (if not already ADMIN)
    if (manager.role !== "ADMIN") {
      await tx.user.update({
        where: { id: data.managerId },
        data:  { role: "WAREHOUSE" },
      });
    }

    return warehouse;
  });
};


// showAll=true  → admin view: returns ALL warehouses (active + inactive)
// showAll=false → default:    returns only active warehouses
const listWarehouses = (showAll = false) =>
  prisma.warehouse.findMany({
    ...(showAll ? {} : { where: { isActive: true } }),
    include: { manager: { select: { id: true, name: true, email: true } }, _count: { select: { locationStocks: true, fulfillmentTasks: true } } },
    orderBy: { name: "asc" },
  });

const getWarehouse = async (id: string) => {
  const w = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      locations: true,
      locationStocks: { include: { medicine: { select: { id: true, name: true, price: true, image: true } } } },
      storageBins: { include: { location: true } },
    },
  });
  if (!w) throw new AppError(status.NOT_FOUND, "Warehouse not found");
  return w;
};

const updateWarehouse = async (id: string, data: Partial<{ name: string; address: string; city: string; phone: string; isActive: boolean; lat: number; lng: number }>) => {
  const w = await prisma.warehouse.findUnique({ where: { id } });
  if (!w) throw new AppError(status.NOT_FOUND, "Warehouse not found");
  return prisma.warehouse.update({ where: { id }, data });
};

const deleteWarehouse = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    const warehouse = await tx.warehouse.findUnique({
      where: { id },
      select: { managerId: true },
    });
    if (!warehouse) throw new AppError(status.NOT_FOUND, "Warehouse not found");

    // 1. Delete the warehouse
    await tx.warehouse.delete({ where: { id } });

    // 2. Demote manager role: WAREHOUSE → CUSTOMER (skip if ADMIN)
    const manager = await tx.user.findUnique({ where: { id: warehouse.managerId } });
    if (manager && manager.role === "WAREHOUSE") {
      await tx.user.update({
        where: { id: warehouse.managerId },
        data:  { role: "CUSTOMER" },
      });
    }
  });
};

const getNearestWarehouses = async (lat: number, lng: number) => {
  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true } });
  return warehouses
    .map(w => ({ ...w, distanceKm: parseFloat(haversine(lat, lng, w.lat, w.lng).toFixed(2)) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

const addLocation = (data: { warehouseId: string; zone: string; aisle: string; shelf: string; description?: string }) =>
  prisma.warehouseLocation.create({ data });

const listLocations = (warehouseId: string) =>
  prisma.warehouseLocation.findMany({ where: { warehouseId }, include: { bins: true } });

// ─── Location Change Requests ────────────────────────────────────────────────

const submitLocationRequest = async (
  warehouseId: string,
  requestedById: string,
  data: { address?: string; city?: string; lat?: number; lng?: number; phone?: string; note?: string }
) => {
  const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!wh) throw new AppError(status.NOT_FOUND, "Warehouse not found");

  // Cancel any existing PENDING request for this warehouse before creating a new one
  await prisma.warehouseLocationRequest.updateMany({
    where: { warehouseId, status: "PENDING" },
    data:  { status: "REJECTED", adminNote: "Superseded by a newer request" },
  });

  return prisma.warehouseLocationRequest.create({
    data: { warehouseId, requestedById, ...data },
    include: { warehouse: { select: { name: true } }, requestedBy: { select: { name: true } } },
  });
};

const listLocationRequests = (filterStatus?: string) =>
  prisma.warehouseLocationRequest.findMany({
    ...(filterStatus ? { where: { status: filterStatus as any } } : {}),
    include: {
      warehouse:   { select: { id: true, name: true, city: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy:  { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

const reviewLocationRequest = async (
  reqId: string,
  reviewerId: string,
  action: "APPROVED" | "REJECTED",
  adminNote?: string
) => {
  const req = await prisma.warehouseLocationRequest.findUnique({
    where: { id: reqId },
  });
  if (!req) throw new AppError(status.NOT_FOUND, "Request not found");
  if (req.status !== "PENDING") throw new AppError(status.BAD_REQUEST, "Request already reviewed");

  return prisma.$transaction(async (tx) => {
    // 1. Mark request as approved/rejected
    const updated = await tx.warehouseLocationRequest.update({
      where: { id: reqId },
      data:  {
        status: action,
        reviewedById: reviewerId,
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
    });

    // 2. If approved, apply the changes to the actual warehouse
    if (action === "APPROVED") {
      const patch: Record<string, any> = {};
      if (req.address) patch.address = req.address;
      if (req.city)    patch.city    = req.city;
      if (req.lat)     patch.lat     = req.lat;
      if (req.lng)     patch.lng     = req.lng;
      if (req.phone)   patch.phone   = req.phone;

      if (Object.keys(patch).length > 0) {
        await tx.warehouse.update({ where: { id: req.warehouseId }, data: patch });
      }
    }

    return updated;
  });
};

// ─── Get warehouse managed by the current user (WAREHOUSE role) ──────────────
const getMyWarehouse = async (userId: string) => {
  const wh = await prisma.warehouse.findFirst({
    where: { managerId: userId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      locationStocks: {
        include: {
          medicine: { select: { id: true, name: true, price: true, image: true, stock: true, genericName: true } },
        },
        orderBy: { medicine: { name: "asc" } },
      },
      _count: { select: { locationStocks: true, fulfillmentTasks: true } },
    },
  });
  if (!wh) throw new AppError(status.NOT_FOUND, "No warehouse found for this manager");
  return wh;
};

// ─── Get inbound shipment legs for a warehouse as DESTINATION ─────────────────
// Returns all legs where destWarehouseId = warehouseId, with per-seller item details.
// Used by the warehouse Inbound Orders panel.
const getInboundOrders = (warehouseId: string) =>
  prisma.shipmentLeg.findMany({
    where: { destWarehouseId: warehouseId },
    include: {
      subOrder: {
        include: {
          seller: { select: { id: true, name: true, email: true, businessCity: true } },
          items: {
            include: {
              medicine: { select: { id: true, name: true, price: true, image: true } },
            },
          },
        },
      },
      order: {
        select: {
          id: true, address: true, createdAt: true, status: true,
          user: { select: { name: true, email: true } },
        },
      },
      originWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } },
      destWarehouse:   { select: { id: true, name: true, city: true, address: true } },
    },
    orderBy: { createdAt: "desc" },
  });

export const warehouseService = {
  createWarehouse, listWarehouses, getWarehouse, updateWarehouse,
  deleteWarehouse, getNearestWarehouses, addLocation, listLocations,
  submitLocationRequest, listLocationRequests, reviewLocationRequest,
  getMyWarehouse, getInboundOrders,
};
