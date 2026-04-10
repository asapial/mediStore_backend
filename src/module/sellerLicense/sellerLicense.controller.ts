import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { sellerLicenseService } from "./sellerLicense.service";
import status from "http-status";

type LicenseStatus = "PENDING" | "VERIFIED" | "REJECTED";

const submitLicense = catchAsync(async (req: Request, res: Response) => {
  const { licenseNumber, documentUrl } = req.body;
  if (!licenseNumber || !documentUrl) throw new AppError(status.BAD_REQUEST, "licenseNumber and documentUrl are required");
  const data = await sellerLicenseService.submitLicense(req.user.id, licenseNumber, documentUrl);
  sendResponse(res, { status: status.OK, success: true, message: "License submitted", data });
});

const getMyLicense = catchAsync(async (req: Request, res: Response) => {
  const data = await sellerLicenseService.getMyLicense(req.user.id);
  sendResponse(res, { status: status.OK, success: true, message: "License fetched", data });
});

const getAllLicenses = catchAsync(async (req: Request, res: Response) => {
  const licenseStatus = req.query.status as LicenseStatus | undefined;
  const data = await sellerLicenseService.getAllLicenses(licenseStatus);
  sendResponse(res, { status: status.OK, success: true, message: "All licenses fetched", data });
});

const reviewLicense = catchAsync(async (req: Request, res: Response) => {
  const sellerId = String(req.params.sellerId);
  const { status: licenseStatus, adminNote } = req.body;
  if (!licenseStatus) throw new AppError(status.BAD_REQUEST, "status is required");
  const data = await sellerLicenseService.reviewLicense(sellerId, licenseStatus as LicenseStatus, adminNote);
  sendResponse(res, { status: status.OK, success: true, message: "License reviewed", data });
});

export const sellerLicenseController = { submitLicense, getMyLicense, getAllLicenses, reviewLicense };
