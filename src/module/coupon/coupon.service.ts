import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─── Get all coupons ──────────────────────────────────────────────────────────
// SELLER  → only their coupons (filtered by sellerId)
// CUSTOMER/ADMIN → all coupons (no filter)
const getAllCoupons = async (sellerId?: string) => {
  return prisma.coupon.findMany({
    where: sellerId !== undefined ? { sellerId } : {},
    orderBy: { createdAt: "desc" },
  });
};

// ─── Validate & apply coupon ──────────────────────────────────────────────────
const applyCoupon = async (userId: string, code: string, orderTotal: number) => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive)
    throw new AppError(status.BAD_REQUEST, "Invalid or inactive coupon");

  if (coupon.expiresAt && coupon.expiresAt < new Date())
    throw new AppError(status.BAD_REQUEST, "Coupon has expired");

  if (coupon.usedCount >= coupon.maxUses)
    throw new AppError(status.BAD_REQUEST, "Coupon usage limit reached");

  if (orderTotal < coupon.minOrderAmt)
    throw new AppError(
      status.BAD_REQUEST,
      `Minimum order amount for this coupon is $${coupon.minOrderAmt}`
    );

  const alreadyUsed = await prisma.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId } },
  });
  if (alreadyUsed)
    throw new AppError(status.BAD_REQUEST, "You have already used this coupon");

  const discount =
    coupon.type === "PERCENTAGE"
      ? (orderTotal * coupon.value) / 100
      : Math.min(coupon.value, orderTotal);

  return {
    coupon,
    discount:   parseFloat(discount.toFixed(2)),
    finalTotal: parseFloat((orderTotal - discount).toFixed(2)),
  };
};

// ─── Create coupon (only known fields — no req.body pollution) ────────────────
const createCoupon = async (data: {
  code:        string;
  type:        "PERCENTAGE" | "FIXED";
  value:       number;
  minOrderAmt?: number;
  maxUses?:    number;
  expiresAt?:  string;
  sellerId?:   string;
}) => {
  const code    = data.code.trim().toUpperCase();
  const couponType: "PERCENTAGE" | "FIXED" = data.type === "FIXED" ? "FIXED" : "PERCENTAGE";

  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) throw new AppError(status.CONFLICT, `Coupon code "${code}" already exists`);

  return prisma.coupon.create({
    data: {
      code,
      type:        couponType,
      value:       Number(data.value),
      minOrderAmt: Number(data.minOrderAmt ?? 0),
      maxUses:     Number(data.maxUses ?? 100),
      isActive:    true,
      usedCount:   0,
      ...(data.sellerId  ? { sellerId: data.sellerId }             : {}),
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
    },
  });
};

// ─── Toggle active ────────────────────────────────────────────────────────────
const toggleCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError(status.NOT_FOUND, "Coupon not found");
  return prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
};

// ─── Delete coupon ────────────────────────────────────────────────────────────
const deleteCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError(status.NOT_FOUND, "Coupon not found");
  return prisma.coupon.delete({ where: { id } });
};

export const couponService = {
  getAllCoupons,
  applyCoupon,
  createCoupon,
  toggleCoupon,
  deleteCoupon,
};
