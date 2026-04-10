import {
  SubscriptionFrequency,
  SubscriptionStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcNextRefill = (frequency: SubscriptionFrequency): Date => {
  const now = new Date();
  if (frequency === "WEEKLY") now.setDate(now.getDate() + 7);
  else if (frequency === "BIWEEKLY") now.setDate(now.getDate() + 14);
  else now.setMonth(now.getMonth() + 1); // MONTHLY
  return now;
};

// ─── Customer: create subscription ───────────────────────────────────────────
const createSubscription = async (
  userId: string,
  medicineId: string,
  quantity: number,
  frequency: SubscriptionFrequency
) => {
  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
    select: { sellerId: true },
  });
  if (!medicine) throw new Error("Medicine not found");

  return prisma.subscription.create({
    data: {
      userId,
      medicineId,
      sellerId: medicine.sellerId,
      quantity,
      frequency,
      nextRefillAt: calcNextRefill(frequency),
    },
    include: {
      medicine: { select: { id: true, name: true, price: true, image: true } },
    },
  });
};

// ─── Customer / Seller: list subscriptions ───────────────────────────────────
const getMySubscriptions = async (userId: string) => {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      medicine: { select: { id: true, name: true, price: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getSellerSubscriptions = async (sellerId: string) => {
  return prisma.subscription.findMany({
    where: { sellerId },
    include: {
      medicine: { select: { id: true, name: true, price: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Update status (pause / cancel / reactivate) ─────────────────────────────
const updateSubscriptionStatus = async (
  id: string,
  userId: string,
  status: SubscriptionStatus
) => {
  return prisma.subscription.update({
    where: { id, userId },
    data: { status },
  });
};

export const subscriptionService = {
  createSubscription,
  getMySubscriptions,
  getSellerSubscriptions,
  updateSubscriptionStatus,
};
