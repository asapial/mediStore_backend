import { TransactionType } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

// ─── Get or create wallet for a user ─────────────────────────────────────────
const getOrCreateWallet = async (userId: string) => {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId } });
  }
  return wallet;
};

// ─── Customer: get wallet with recent transactions ────────────────────────────
const getWalletWithTransactions = async (userId: string) => {
  const wallet = await getOrCreateWallet(userId);
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { ...wallet, transactions };
};

// ─── Credit wallet ────────────────────────────────────────────────────────────
const creditWallet = async (userId: string, amount: number, description?: string) => {
  const wallet = await getOrCreateWallet(userId);
  const [updatedWallet, txn] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: TransactionType.DEPOSIT,
        ...(description !== undefined ? { description } : {}),
      },
    }),
  ]);
  return { wallet: updatedWallet, transaction: txn };
};

// ─── Debit wallet ─────────────────────────────────────────────────────────────
const debitWallet = async (userId: string, amount: number, description?: string) => {
  const wallet = await getOrCreateWallet(userId);
  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }
  const [updatedWallet, txn] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: TransactionType.PURCHASE,
        ...(description !== undefined ? { description } : {}),
      },
    }),
  ]);
  return { wallet: updatedWallet, transaction: txn };
};

// ─── Admin: all wallets ───────────────────────────────────────────────────────
const getAllWallets = async () => {
  return prisma.wallet.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { balance: "desc" },
  });
};

// ─── Seller: get own wallet with transactions + stats ─────────────────────────
const getSellerWallet = async (sellerId: string) => {
  const wallet = await getOrCreateWallet(sellerId);
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
    where: { sellerId, status: "PENDING" },
  });
  const pendingAmount = pendingWithdrawals.reduce((s, w) => s + w.amount, 0);
  const totalEarned = transactions.filter(t => t.type === "DEPOSIT").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.type === "WITHDRAWAL").reduce((s, t) => s + t.amount, 0);
  return { ...wallet, transactions, pendingAmount, totalEarned, totalWithdrawn };
};

// ─── Seller: request a withdrawal ─────────────────────────────────────────────
const requestWithdrawal = async (
  sellerId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  branchName?: string
) => {
  const wallet = await getOrCreateWallet(sellerId);
  if (wallet.balance < amount) throw new Error("Insufficient wallet balance for this withdrawal");
  if (amount < 10) throw new Error("Minimum withdrawal amount is $10");
  return prisma.withdrawalRequest.create({
    data: { sellerId, amount, bankName, accountNumber, branchName },
  });
};

// ─── Seller: get own withdrawal history ──────────────────────────────────────
const getSellerWithdrawals = async (sellerId: string) => {
  return prisma.withdrawalRequest.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: all withdrawals with seller info ──────────────────────────────────
const getAllWithdrawals = async (statusFilter?: string) => {
  return prisma.withdrawalRequest.findMany({
    where: statusFilter ? { status: statusFilter as any } : undefined,
    include: {
      seller: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: approve or reject withdrawal ─────────────────────────────────────
const processWithdrawal = async (
  id: string,
  action: "APPROVED" | "REJECTED",
  adminNote?: string
) => {
  const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Withdrawal request not found");
  if (request.status !== "PENDING") throw new Error("Request is already processed");

  if (action === "APPROVED") {
    const wallet = await getOrCreateWallet(request.sellerId);
    if (wallet.balance < request.amount) throw new Error("Seller has insufficient balance");
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: request.amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: request.amount,
          type: TransactionType.WITHDRAWAL,
          description: `Withdrawal approved — ref #${id.slice(-6).toUpperCase()}`,
        },
      }),
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "APPROVED", adminNote: adminNote || null, processedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "REJECTED", adminNote: adminNote || null, processedAt: new Date() },
    });
  }

  return prisma.withdrawalRequest.findUnique({ where: { id } });
};

export const walletService = {
  getWalletWithTransactions,
  creditWallet,
  debitWallet,
  getAllWallets,
  getOrCreateWallet,
  getSellerWallet,
  requestWithdrawal,
  getSellerWithdrawals,
  getAllWithdrawals,
  processWithdrawal,
};
