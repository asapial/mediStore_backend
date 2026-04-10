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

// ─── Get wallet with recent transactions ────────────────────────────────────
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
        description,
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
        description,
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

export const walletService = {
  getWalletWithTransactions,
  creditWallet,
  debitWallet,
  getAllWallets,
  getOrCreateWallet,
};
