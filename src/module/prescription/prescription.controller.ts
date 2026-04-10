import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { prescriptionService } from "./prescription.service";
import { PrescriptionStatus } from "../../../generated/prisma/enums";
import status from "http-status";

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────
const uploadPrescription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { imageUrl, notes } = req.body;

  if (!imageUrl) throw new AppError(status.BAD_REQUEST, "imageUrl is required");

  const data = await prescriptionService.uploadPrescription(userId, imageUrl, notes);

  sendResponse(res, {
    status: status.CREATED,
    success: true,
    message: "Prescription uploaded successfully",
    data,
  });
});

const getMyPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const data = await prescriptionService.getMyPrescriptions(userId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Prescriptions fetched successfully",
    data,
  });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const getAllPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const statusFilter = req.query.status as PrescriptionStatus | undefined;
  const data = await prescriptionService.getAllPrescriptions(statusFilter);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "All prescriptions fetched",
    data,
  });
});

const reviewPrescription = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status: newStatus, adminNote } = req.body;

  if (!newStatus) throw new AppError(status.BAD_REQUEST, "status is required");

  const data = await prescriptionService.reviewPrescription(
    id,
    newStatus as PrescriptionStatus,
    adminNote
  );

  sendResponse(res, { status: status.OK, success: true, message: "Prescription reviewed", data });
});

export const prescriptionController = {
  uploadPrescription,
  getMyPrescriptions,
  getAllPrescriptions,
  reviewPrescription,
};
