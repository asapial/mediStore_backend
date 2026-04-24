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

const createWarehouse = (data: {
  name: string; address: string; city: string; lat: number; lng: number;
  managerId: string; phone?: string; country?: string;
}) => prisma.warehouse.create({ data, include: { manager: { select: { id: true, name: true, email: true } } } });

const listWarehouses = () =>
  prisma.warehouse.findMany({
    where: { isActive: true },
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

export const warehouseService = {
  createWarehouse, listWarehouses, getWarehouse, updateWarehouse,
  getNearestWarehouses, addLocation, listLocations,
};
