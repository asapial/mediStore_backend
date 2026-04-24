import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import { locationStockService } from "../warehouse/locationStock.service";
import status from "http-status";

const createTransfer = async (data: {
  fromWarehouseId: string; toWarehouseId: string; requestedById: string;
  notes?: string; items: { medicineId: string; quantity: number }[];
}) => {
  const { items, ...transferData } = data;
  return prisma.stockTransfer.create({
    data: {
      ...transferData,
      items: { create: items },
    },
    include: { items: { include: { medicine: { select: { id: true, name: true } } } } },
  });
};

const listTransfers = (warehouseId?: string) =>
  prisma.stockTransfer.findMany({
    where: warehouseId
      ? { OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }] }
      : {},
    include: {
      fromWarehouse: { select: { id: true, name: true, city: true } },
      toWarehouse:   { select: { id: true, name: true, city: true } },
      requestedBy:   { select: { id: true, name: true } },
      items: { include: { medicine: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

const approveTransfer = async (id: string) => {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id }, include: { items: true },
  });
  if (!transfer) throw new AppError(status.NOT_FOUND, "Transfer not found");
  if (transfer.status !== "PENDING") throw new AppError(status.BAD_REQUEST, "Transfer is not PENDING");

  // Validate source warehouse has enough stock
  for (const item of transfer.items) {
    const src = await prisma.locationStock.findUnique({
      where: { warehouseId_medicineId: { warehouseId: transfer.fromWarehouseId, medicineId: item.medicineId } },
    });
    if (!src || src.quantity < item.quantity) {
      throw new AppError(status.BAD_REQUEST, `Insufficient stock for medicine ${item.medicineId} in source warehouse`);
    }
  }
  return prisma.stockTransfer.update({ where: { id }, data: { status: "IN_TRANSIT" } });
};

const completeTransfer = async (id: string) => {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id }, include: { items: true },
  });
  if (!transfer) throw new AppError(status.NOT_FOUND, "Transfer not found");
  if (transfer.status !== "IN_TRANSIT") throw new AppError(status.BAD_REQUEST, "Transfer must be IN_TRANSIT");

  // Deduct from source, add to destination
  await Promise.all(transfer.items.map(async item => {
    await locationStockService.adjustStock(transfer.fromWarehouseId, item.medicineId, -item.quantity);
    await locationStockService.adjustStock(transfer.toWarehouseId,   item.medicineId,  item.quantity);
  }));

  return prisma.stockTransfer.update({ where: { id }, data: { status: "COMPLETED" } });
};

const cancelTransfer = async (id: string) => {
  const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
  if (!transfer) throw new AppError(status.NOT_FOUND, "Transfer not found");
  if (transfer.status === "COMPLETED") throw new AppError(status.BAD_REQUEST, "Cannot cancel a completed transfer");
  return prisma.stockTransfer.update({ where: { id }, data: { status: "CANCELLED" } });
};

export const stockTransferService = { createTransfer, listTransfers, approveTransfer, completeTransfer, cancelTransfer };
