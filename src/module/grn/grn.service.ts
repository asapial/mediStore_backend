import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import { locationStockService } from "../warehouse/locationStock.service";
import status from "http-status";

const createGRN = (data: {
  warehouseId: string; supplierId: string; receivedById: string;
  shipmentId?: string; notes?: string;
  items: { medicineId: string; expectedQty: number; receivedQty: number; batchNumber?: string; expiryDate?: string }[];
}) => {
  const { items, ...grnData } = data;
  return prisma.goodsReceiptNote.create({
    data: {
      ...grnData,
      items: {
        create: items.map(i => ({
          medicine:    { connect: { id: i.medicineId } },
          expectedQty: i.expectedQty,
          receivedQty: i.receivedQty,
          ...(i.batchNumber ? { batchNumber: i.batchNumber } : {}),
          ...(i.expiryDate  ? { expiryDate: new Date(i.expiryDate) } : {}),
        })),
      },
    },
    include: { items: { include: { medicine: { select: { id: true, name: true } } } }, supplier: true },
  });
};

const listGRNs = (warehouseId?: string) =>
  prisma.goodsReceiptNote.findMany({
    where: warehouseId ? { warehouseId } : {},
    include: {
      supplier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true } },
      receivedBy: { select: { id: true, name: true } },
      items: { include: { medicine: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

const getGRN = async (id: string) => {
  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id },
    include: {
      supplier: true, warehouse: true,
      receivedBy: { select: { id: true, name: true } },
      items: { include: { medicine: true } },
    },
  });
  if (!grn) throw new AppError(status.NOT_FOUND, "GRN not found");
  return grn;
};

const verifyGRN = async (id: string) => {
  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id }, include: { items: true },
  });
  if (!grn) throw new AppError(status.NOT_FOUND, "GRN not found");
  if (grn.status === "VERIFIED") throw new AppError(status.BAD_REQUEST, "GRN already verified");

  const now = new Date();
  // Increment location stock for each received item
  await Promise.all(grn.items.map(async item => {
    await locationStockService.adjustStock(grn.warehouseId, item.medicineId, item.receivedQty);
    // Auto-create expiry alerts for items expiring within 90 days
    if (item.expiryDate) {
      const daysLeft = Math.floor((item.expiryDate.getTime() - now.getTime()) / 86400000);
      if (daysLeft <= 90) {
        const severity = daysLeft <= 7 ? "CRITICAL" : daysLeft <= 30 ? "HIGH" : daysLeft <= 60 ? "MEDIUM" : "LOW";
        await prisma.expiryAlert.create({
          data: {
            warehouseId: grn.warehouseId, medicineId: item.medicineId,
            batchNumber: item.batchNumber || "N/A", expiresAt: item.expiryDate,
            daysLeft, severity: severity as any,
          },
        });
      }
    }
  }));

  return prisma.goodsReceiptNote.update({ where: { id }, data: { status: "VERIFIED" } });
};

export const grnService = { createGRN, listGRNs, getGRN, verifyGRN };
