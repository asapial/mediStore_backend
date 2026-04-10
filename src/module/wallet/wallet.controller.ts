import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { walletService } from "./wallet.service";
import status from "http-status";

// ─── CUSTOMER: view my wallet ─────────────────────────────────────────────────
const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const data = await walletService.getWalletWithTransactions(userId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Wallet fetched successfully",
    data,
  });
});

// ─── CUSTOMER: credit wallet (top-up) ────────────────────────────────────────
const topUpWallet = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { amount, description } = req.body;

  if (!amount || amount <= 0)
    throw new AppError(status.BAD_REQUEST, "amount must be a positive number");

  const data = await walletService.creditWallet(userId, Number(amount), description);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Wallet topped up successfully",
    data,
  });
});

// ─── ADMIN: list all wallets ──────────────────────────────────────────────────
const getAllWallets = catchAsync(async (_req: Request, res: Response) => {
  const data = await walletService.getAllWallets();

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "All wallets fetched",
    data,
  });
});

// ─── ADMIN: credit a specific user's wallet ───────────────────────────────────
const adminCreditWallet = catchAsync(async (req: Request, res: Response) => {
  const { userId, amount, description } = req.body;

  if (!userId) throw new AppError(status.BAD_REQUEST, "userId is required");
  if (!amount || amount <= 0)
    throw new AppError(status.BAD_REQUEST, "amount must be a positive number");

  const data = await walletService.creditWallet(userId, Number(amount), description);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Wallet credited successfully",
    data,
  });
});

export const walletController = {
  getMyWallet,
  topUpWallet,
  getAllWallets,
  adminCreditWallet,
};
