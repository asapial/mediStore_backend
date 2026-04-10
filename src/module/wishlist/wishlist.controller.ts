import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { wishlistService } from "./wishlist.service";
import status from "http-status";

const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const data = await wishlistService.getOrCreate(req.user.id);
  sendResponse(res, { status: status.OK, success: true, message: "Wishlist fetched", data });
});

const addItem = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.body;
  if (!medicineId) throw new AppError(status.BAD_REQUEST, "medicineId is required");
  const data = await wishlistService.addItem(req.user.id, medicineId);
  sendResponse(res, { status: status.CREATED, success: true, message: "Added to wishlist", data });
});

const removeItem = catchAsync(async (req: Request, res: Response) => {
  const data = await wishlistService.removeItem(req.user.id, String(req.params.medicineId));
  sendResponse(res, { status: status.OK, success: true, message: "Removed from wishlist", data });
});

const clearWishlist = catchAsync(async (req: Request, res: Response) => {
  await wishlistService.clearWishlist(req.user.id);
  sendResponse(res, { status: status.OK, success: true, message: "Wishlist cleared", data: null });
});

export const wishlistController = { getWishlist, addItem, removeItem, clearWishlist };
