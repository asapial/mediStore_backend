import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { medicineBatchService } from "./medicineBatch.service";
import status from "http-status";

// ─── SELLER: create a new batch ───────────────────────────────────────────────
const createBatch = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const { medicineId, batchNumber, quantity, expiryDate, purchaseDate } = req.body;

  if (!medicineId || !batchNumber || !quantity || !expiryDate)
    throw new AppError(
      status.BAD_REQUEST,
      "medicineId, batchNumber, quantity, and expiryDate are required"
    );

  const data = await medicineBatchService.createBatch(sellerId, {
    medicineId,
    batchNumber,
    quantity: Number(quantity),
    expiryDate,
    purchaseDate,
  });

  sendResponse(res, {
    status: status.CREATED,
    success: true,
    message: "Batch created successfully",
    data,
  });
});

// ─── SELLER: list all batches ─────────────────────────────────────────────────
const getSellerBatches = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const data = await medicineBatchService.getSellerBatches(sellerId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Batches fetched successfully",
    data,
  });
});

// ─── SELLER: expiring / expired batches ──────────────────────────────────────
const getExpiringBatches = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const days = Number(req.query.days ?? 30);
  const data = await medicineBatchService.getExpiringBatches(sellerId, days);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Expiring batches fetched",
    data,
  });
});

// ─── SELLER: delete a batch ───────────────────────────────────────────────────
const deleteBatch = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const { id } = req.params;
  const data = await medicineBatchService.deleteBatch(id, sellerId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Batch deleted",
    data,
  });
});

export const medicineBatchController = {
  createBatch,
  getSellerBatches,
  getExpiringBatches,
  deleteBatch,
};
