import { PrescriptionStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

// ─── Customer: upload a prescription ─────────────────────────────────────────
const uploadPrescription = async (userId: string, imageUrl: string, notes?: string) => {
  return prisma.prescription.create({
    data: {
      userId,
      imageUrl,
      ...(notes !== undefined ? { notes } : {}),
    },
  });
};

// ─── Customer: list own prescriptions ────────────────────────────────────────
const getMyPrescriptions = async (userId: string) => {
  return prisma.prescription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: list all prescriptions ───────────────────────────────────────────
const getAllPrescriptions = async (status?: PrescriptionStatus) => {
  return prisma.prescription.findMany({
    where: status !== undefined ? { status } : {},
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: approve or reject a prescription ─────────────────────────────────
const reviewPrescription = async (
  id: string,
  status: PrescriptionStatus,
  adminNote?: string
) => {
  return prisma.prescription.update({
    where: { id },
    data: {
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });
};

export const prescriptionService = {
  uploadPrescription,
  getMyPrescriptions,
  getAllPrescriptions,
  reviewPrescription,
};
