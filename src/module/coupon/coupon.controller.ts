import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { couponService } from "./coupon.service";
import status from "http-status";

// ─── GET /api/coupons ─────────────────────────────────────────────────────────
// SELLER  → sees only their own coupons
// CUSTOMER/ADMIN → sees all coupons
const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.role === "SELLER" ? String(req.user.id) : undefined;
  const data = await couponService.getAllCoupons(sellerId);
  sendResponse(res, { status: status.OK, success: true, message: "Coupons fetched", data });
});

// ─── POST /api/coupons ────────────────────────────────────────────────────────
// Only SELLER and ADMIN can create — sellerId auto-set from session for SELLER
const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const { code, type, value, minOrderAmt, maxUses, expiresAt } = req.body;

  console.log("HI from coupons")

  if (!code)  throw new AppError(status.BAD_REQUEST, "code is required");
  if (!type)  throw new AppError(status.BAD_REQUEST, "type is required (PERCENTAGE or FIXED)");
  if (value === undefined || value === null)
    throw new AppError(status.BAD_REQUEST, "value is required");

  // Sellers always own the coupon; admins can pass sellerId in body for platform coupons
  const sellerId: string | undefined =
    req.user.role === "SELLER" ? String(req.user.id) : (req.body.sellerId as string | undefined);

  const data = await couponService.createCoupon({
    code:        String(code),
    type:        type === "FIXED" ? "FIXED" : "PERCENTAGE",
    value:       Number(value),
    minOrderAmt: minOrderAmt !== undefined ? Number(minOrderAmt) : 0,
    maxUses:     maxUses     !== undefined ? Number(maxUses)     : 100,
    ...(expiresAt  ? { expiresAt:  String(expiresAt) }  : {}),
    ...(sellerId   ? { sellerId }                        : {}),
  });

  sendResponse(res, { status: status.CREATED, success: true, message: "Coupon created", data });
});

// ─── POST /api/coupons/apply ──────────────────────────────────────────────────
const applyCoupon = catchAsync(async (req: Request, res: Response) => {
  const { code, orderTotal } = req.body;
  if (!code || !orderTotal)
    throw new AppError(status.BAD_REQUEST, "code and orderTotal are required");
  const data = await couponService.applyCoupon(
    String(req.user.id),
    String(code),
    Number(orderTotal)
  );
  sendResponse(res, { status: status.OK, success: true, message: "Coupon applied", data });
});

// ─── PATCH /api/coupons/:id/toggle ───────────────────────────────────────────
const toggleCoupon = catchAsync(async (req: Request, res: Response) => {
  const data = await couponService.toggleCoupon(String(req.params.id));
  sendResponse(res, { status: status.OK, success: true, message: "Coupon toggled", data });
});

// ─── DELETE /api/coupons/:id ──────────────────────────────────────────────────
const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  await couponService.deleteCoupon(String(req.params.id));
  sendResponse(res, { status: status.OK, success: true, message: "Coupon deleted", data: null });
});

export const couponController = {
  getAllCoupons,
  createCoupon,
  applyCoupon,
  toggleCoupon,
  deleteCoupon,
};
