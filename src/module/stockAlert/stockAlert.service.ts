import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Upsert a stock-alert threshold for a medicine ───────────────────────────
const upsertStockAlert = async (
  medicineId: string,
  threshold: number,
  isActive: boolean = true
) => {
  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) throw new AppError(status.NOT_FOUND, "Medicine not found");

  return prisma.stockAlert.upsert({
    where: { medicineId },
    update: { threshold, isActive },
    create: { medicineId, threshold, isActive },
    include: {
      medicine: { select: { id: true, name: true, stock: true } },
    },
  });
};

// ─── Seller: list alerts for own medicines ────────────────────────────────────
const getSellerAlerts = async (sellerId: string) => {
  return prisma.stockAlert.findMany({
    where: { medicine: { sellerId } },
    include: {
      medicine: { select: { id: true, name: true, stock: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: list all triggered alerts (stock <= threshold) ────────────────────
const getTriggeredAlerts = async () => {
  const alerts = await prisma.stockAlert.findMany({
    where: { isActive: true },
    include: {
      medicine: {
        select: { id: true, name: true, stock: true, image: true, seller: { select: { name: true, email: true } } },
      },
    },
  });
  return alerts.filter((a) => a.medicine.stock <= a.threshold);
};

// ─── Delete a stock alert ─────────────────────────────────────────────────────
const deleteStockAlert = async (medicineId: string) => {
  return prisma.stockAlert.delete({ where: { medicineId } });
};

export const stockAlertService = {
  upsertStockAlert,
  getSellerAlerts,
  getTriggeredAlerts,
  deleteStockAlert,
};
