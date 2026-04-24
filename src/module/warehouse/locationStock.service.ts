import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

const getStock = (warehouseId: string) =>
  prisma.locationStock.findMany({
    where: { warehouseId },
    include: { medicine: { select: { id: true, name: true, price: true, image: true, stock: true } } },
    orderBy: { medicine: { name: "asc" } },
  });

const adjustStock = async (warehouseId: string, medicineId: string, delta: number) => {
  const existing = await prisma.locationStock.findUnique({
    where: { warehouseId_medicineId: { warehouseId, medicineId } },
  });
  if (existing) {
    const newQty = existing.quantity + delta;
    if (newQty < 0) throw new AppError(status.BAD_REQUEST, "Insufficient warehouse stock");
    return prisma.locationStock.update({
      where: { warehouseId_medicineId: { warehouseId, medicineId } },
      data: { quantity: newQty },
    });
  }
  if (delta < 0) throw new AppError(status.BAD_REQUEST, "No stock record found");
  return prisma.locationStock.create({ data: { warehouseId, medicineId, quantity: delta } });
};

const setStock = (warehouseId: string, medicineId: string, quantity: number) =>
  prisma.locationStock.upsert({
    where: { warehouseId_medicineId: { warehouseId, medicineId } },
    update: { quantity },
    create: { warehouseId, medicineId, quantity },
  });

export const locationStockService = { getStock, adjustStock, setStock };
