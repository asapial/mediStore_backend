import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

type LicenseStatus = "PENDING" | "VERIFIED" | "REJECTED";

// ─── Seller: submit / update license ─────────────────────────────────────────
const submitLicense = async (
  sellerId: string,
  licenseNumber: string,
  documentUrl: string
) => {
  return prisma.sellerLicense.upsert({
    where: { sellerId },
    update: { licenseNumber, documentUrl, status: "PENDING", adminNote: null },
    create: { sellerId, licenseNumber, documentUrl },
  });
};

// ─── Seller: get own license ──────────────────────────────────────────────────
const getMyLicense = async (sellerId: string) => {
  return prisma.sellerLicense.findUnique({ where: { sellerId } });
};

// ─── Admin: get all licenses ──────────────────────────────────────────────────
const getAllLicenses = async (licenseStatus?: LicenseStatus) => {
  return prisma.sellerLicense.findMany({
    where: licenseStatus ? { status: licenseStatus } : {},
    include: {
      seller: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Admin: review license ────────────────────────────────────────────────────
const reviewLicense = async (
  sellerId: string,
  licenseStatus: LicenseStatus,
  adminNote?: string
) => {
  const license = await prisma.sellerLicense.findUnique({ where: { sellerId } });
  if (!license) throw new AppError(status.NOT_FOUND, "License not found");

  return prisma.sellerLicense.update({
    where: { sellerId },
    data: {
      status: licenseStatus,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });
};

// ─── Admin: delete license by license id ─────────────────────────────────────
const deleteLicense = async (licenseId: string) => {
  const license = await prisma.sellerLicense.findUnique({ where: { id: licenseId } });
  if (!license) throw new AppError(status.NOT_FOUND, "License not found");
  return prisma.sellerLicense.delete({ where: { id: licenseId } });
};

export const sellerLicenseService = {
  submitLicense,
  getMyLicense,
  getAllLicenses,
  reviewLicense,
  deleteLicense,
};
