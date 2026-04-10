import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { subscriptionService } from "./subscription.service";
import {
  SubscriptionFrequency,
  SubscriptionStatus,
} from "../../../generated/prisma/enums";
import status from "http-status";

// ─── CUSTOMER: create subscription ───────────────────────────────────────────
const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { medicineId, quantity = 1, frequency = "MONTHLY" } = req.body;

  if (!medicineId) throw new AppError(status.BAD_REQUEST, "medicineId is required");

  const data = await subscriptionService.createSubscription(
    userId,
    medicineId,
    Number(quantity),
    frequency as SubscriptionFrequency
  );

  sendResponse(res, {
    status: status.CREATED,
    success: true,
    message: "Subscription created successfully",
    data,
  });
});

// ─── CUSTOMER: my subscriptions ──────────────────────────────────────────────
const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const data = await subscriptionService.getMySubscriptions(userId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Subscriptions fetched",
    data,
  });
});

// ─── CUSTOMER: update status ──────────────────────────────────────────────────
const updateSubscriptionStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const id = String(req.params.id);
  const { status: newStatus } = req.body;

  if (!newStatus) throw new AppError(status.BAD_REQUEST, "status is required");

  const data = await subscriptionService.updateSubscriptionStatus(
    id,
    userId,
    newStatus as SubscriptionStatus
  );

  sendResponse(res, { status: status.OK, success: true, message: "Subscription updated", data });
});

// ─── SELLER: subscriptions for their medicines ────────────────────────────────
const getSellerSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const data = await subscriptionService.getSellerSubscriptions(sellerId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Seller subscriptions fetched",
    data,
  });
});

export const subscriptionController = {
  createSubscription,
  getMySubscriptions,
  updateSubscriptionStatus,
  getSellerSubscriptions,
};
