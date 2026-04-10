import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { stockAlertService } from "./stockAlert.service";
import status from "http-status";

// ─── SELLER: upsert stock alert ───────────────────────────────────────────────
const upsertStockAlert = catchAsync(async (req: Request, res: Response) => {
  const { medicineId, threshold, isActive = true } = req.body;

  if (!medicineId) throw new AppError(status.BAD_REQUEST, "medicineId is required");
  if (threshold === undefined || threshold < 0)
    throw new AppError(status.BAD_REQUEST, "threshold must be a non-negative number");

  const data = await stockAlertService.upsertStockAlert(
    medicineId,
    Number(threshold),
    Boolean(isActive)
  );

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Stock alert saved",
    data,
  });
});

// ─── SELLER: list own alerts ──────────────────────────────────────────────────
const getSellerAlerts = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const data = await stockAlertService.getSellerAlerts(sellerId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Stock alerts fetched",
    data,
  });
});

// ─── ADMIN: list all triggered alerts ────────────────────────────────────────
const getTriggeredAlerts = catchAsync(async (_req: Request, res: Response) => {
  const data = await stockAlertService.getTriggeredAlerts();

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Triggered alerts fetched",
    data,
  });
});

// ─── SELLER: delete a stock alert ────────────────────────────────────────────
const deleteStockAlert = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;
  const data = await stockAlertService.deleteStockAlert(medicineId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Stock alert deleted",
    data,
  });
});

export const stockAlertController = {
  upsertStockAlert,
  getSellerAlerts,
  getTriggeredAlerts,
  deleteStockAlert,
};
