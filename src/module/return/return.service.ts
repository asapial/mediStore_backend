import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

// ─── Customer: submit a return request ────────────────────────────────────────
const submitReturn = async (userId: string, orderId: string, reason: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "DELIVERED" },
  });
  if (!order)
    throw new AppError(status.BAD_REQUEST, "Only delivered orders can be returned");

  const existing = await prisma.returnRequest.findUnique({ where: { orderId } });
  if (existing)
    throw new AppError(status.CONFLICT, "A return request already exists for this order");

  return prisma.returnRequest.create({
    data: { orderId, userId, reason },
    include: { order: { select: { id: true, status: true, address: true } } },
  });
};

// ─── Customer: list own returns ────────────────────────────────────────────────
const getMyReturns = async (userId: string) => {
  return prisma.returnRequest.findMany({
    where: { userId },
    include: {
      order: {
        select: { id: true, status: true, createdAt: true, address: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: list all return requests ──────────────────────────────────────────
const getAllReturns = async (returnStatus?: ReturnStatus) => {
  return prisma.returnRequest.findMany({
    where: returnStatus ? { status: returnStatus } : {},
    include: {
      user: { select: { id: true, name: true, email: true } },
      order: { select: { id: true, status: true, address: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: update return status ──────────────────────────────────────────────
const updateReturnStatus = async (
  id: string,
  returnStatus: ReturnStatus,
  adminNote?: string
) => {
  const req = await prisma.returnRequest.findUnique({ where: { id } });
  if (!req) throw new AppError(status.NOT_FOUND, "Return request not found");

  return prisma.returnRequest.update({
    where: { id },
    data: {
      status: returnStatus,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });
};

export const returnService = {
  submitReturn,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
};
