import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

interface CreateBatchInput {
  medicineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  purchaseDate?: Date;
}

// ─── Create a batch ───────────────────────────────────────────────────────────
const createBatch = async (sellerId: string, input: CreateBatchInput) => {
  const medicine = await prisma.medicine.findFirst({
    where: { id: input.medicineId, sellerId },
  });
  if (!medicine) {
    throw new AppError(status.NOT_FOUND, "Medicine not found or not owned by you");
  }

  return prisma.medicineBatch.create({
    data: {
      medicineId: input.medicineId,
      batchNumber: input.batchNumber,
      quantity: input.quantity,
      expiryDate: new Date(input.expiryDate),
      ...(input.purchaseDate ? { purchaseDate: new Date(input.purchaseDate) } : {}),
    },
    include: {
      medicine: { select: { id: true, name: true } },
    },
  });
};

// ─── Seller: list batches for own medicines ───────────────────────────────────
const getSellerBatches = async (sellerId: string) => {
  return prisma.medicineBatch.findMany({
    where: { medicine: { sellerId } },
    include: {
      medicine: { select: { id: true, name: true, stock: true } },
    },
    orderBy: { expiryDate: "asc" },
  });
};

// ─── Seller: list only expired or near-expiry batches (within N days) ─────────
const getExpiringBatches = async (sellerId: string, daysAhead: number = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  return prisma.medicineBatch.findMany({
    where: {
      medicine: { sellerId },
      expiryDate: { lte: cutoff },
    },
    include: {
      medicine: { select: { id: true, name: true } },
    },
    orderBy: { expiryDate: "asc" },
  });
};

// ─── Delete a batch ───────────────────────────────────────────────────────────
const deleteBatch = async (id: string, sellerId: string) => {
  const batch = await prisma.medicineBatch.findFirst({
    where: { id, medicine: { sellerId } },
  });
  if (!batch) throw new AppError(status.NOT_FOUND, "Batch not found");
  return prisma.medicineBatch.delete({ where: { id } });
};

export const medicineBatchService = {
  createBatch,
  getSellerBatches,
  getExpiringBatches,
  deleteBatch,
};
