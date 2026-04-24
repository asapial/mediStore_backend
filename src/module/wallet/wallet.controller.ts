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
  sendResponse(res, { status: status.OK, success: true, message: "Wallet fetched successfully", data });
});

// ─── CUSTOMER: credit wallet (top-up) ────────────────────────────────────────
const topUpWallet = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { amount, description } = req.body;
  if (!amount || amount <= 0)
    throw new AppError(status.BAD_REQUEST, "amount must be a positive number");
  const data = await walletService.creditWallet(userId, Number(amount), description);
  sendResponse(res, { status: status.OK, success: true, message: "Wallet topped up successfully", data });
});

// ─── ADMIN: list all wallets ──────────────────────────────────────────────────
const getAllWallets = catchAsync(async (_req: Request, res: Response) => {
  const data = await walletService.getAllWallets();
  sendResponse(res, { status: status.OK, success: true, message: "All wallets fetched", data });
});

// ─── ADMIN: credit a specific user's wallet ───────────────────────────────────
const adminCreditWallet = catchAsync(async (req: Request, res: Response) => {
  const { userId, amount, description } = req.body;
  if (!userId) throw new AppError(status.BAD_REQUEST, "userId is required");
  if (!amount || amount <= 0) throw new AppError(status.BAD_REQUEST, "amount must be a positive number");
  const data = await walletService.creditWallet(userId, Number(amount), description);
  sendResponse(res, { status: status.OK, success: true, message: "Wallet credited successfully", data });
});

// ─── SELLER: get own wallet ───────────────────────────────────────────────────
const getSellerWallet = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const data = await walletService.getSellerWallet(sellerId);
  sendResponse(res, { status: status.OK, success: true, message: "Seller wallet fetched", data });
});

// ─── SELLER: get own withdrawal requests ─────────────────────────────────────
const getWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const data = await walletService.getSellerWithdrawals(sellerId);
  sendResponse(res, { status: status.OK, success: true, message: "Withdrawals fetched", data });
});

// ─── SELLER: submit withdrawal request ───────────────────────────────────────
const requestWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const sellerId = req.user.id;
  const { amount, bankName, accountNumber, branchName } = req.body;
  if (!amount || !bankName || !accountNumber)
    throw new AppError(status.BAD_REQUEST, "amount, bankName and accountNumber are required");
  const data = await walletService.requestWithdrawal(
    sellerId, Number(amount), bankName, accountNumber, branchName
  );
  sendResponse(res, { status: status.CREATED, success: true, message: "Withdrawal request submitted", data });
});

// ─── ADMIN: all withdrawal requests ──────────────────────────────────────────
const getAllWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const statusFilter = req.query.status as string | undefined;
  const data = await walletService.getAllWithdrawals(statusFilter);
  sendResponse(res, { status: status.OK, success: true, message: "All withdrawals fetched", data });
});

// ─── ADMIN: approve or reject withdrawal ─────────────────────────────────────
const processWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, adminNote } = req.body;
  if (!["APPROVED", "REJECTED"].includes(action))
    throw new AppError(status.BAD_REQUEST, "action must be APPROVED or REJECTED");
  const data = await walletService.processWithdrawal(id, action, adminNote);
  sendResponse(res, { status: status.OK, success: true, message: `Withdrawal ${action.toLowerCase()}`, data });
});

export const walletController = {
  getMyWallet,
  topUpWallet,
  getAllWallets,
  adminCreditWallet,
  getSellerWallet,
  getWithdrawals,
  requestWithdrawal,
  getAllWithdrawals,
  processWithdrawal,
};
