import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import auth from "../../middleware/auth.middleware";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

const router = Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────

// GET /api/flash-sales/active
router.get("/active", catchAsync(async (req: Request, res: Response) => {
  const now = new Date();
  const sales = await prisma.flashSale.findMany({
    where: { isApproved: true, startAt: { lte: now }, endAt: { gte: now } },
    include: {
      medicine: { select: { id: true, name: true, image: true, manufacturer: true, categoryId: true } },
      seller:   { select: { id: true, name: true } },
    },
    orderBy: { endAt: "asc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Active flash sales", data: sales });
}));

// ── SELLER ────────────────────────────────────────────────────────────────────

// GET /api/flash-sales/my
router.get("/my", auth(["SELLER"]), catchAsync(async (req: Request, res: Response) => {
  const sales = await prisma.flashSale.findMany({
    where: { sellerId: req.user.id },
    include: { medicine: { select: { id: true, name: true, image: true, price: true } } },
    orderBy: { createdAt: "desc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "My flash sales", data: sales });
}));

// POST /api/flash-sales — seller creates
router.post("/", auth(["SELLER"]), catchAsync(async (req: Request, res: Response) => {
  // ── Guard: seller must have a VERIFIED license ──────────────────────────────
  const license = await prisma.sellerLicense.findUnique({ where: { sellerId: req.user.id } });
  if (!license || license.status !== "VERIFIED") {
    throw new AppError(
      status.FORBIDDEN,
      "Your seller license must be approved (VERIFIED) by an admin before you can create flash sales."
    );
  }

  const { medicineId, discountPrice, saleStock, startAt, endAt } = req.body;
  if (!medicineId || !discountPrice || !saleStock || !startAt || !endAt)
    throw new AppError(status.BAD_REQUEST, "medicineId, discountPrice, saleStock, startAt, endAt required");

  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) throw new AppError(status.NOT_FOUND, "Medicine not found");
  if (medicine.sellerId !== req.user.id) throw new AppError(status.FORBIDDEN, "Not your medicine");

  // ── Guard: saleStock must not exceed the medicine's total stock ─────────────
  if (Number(saleStock) > medicine.stock) {
    throw new AppError(
      status.BAD_REQUEST,
      `Flash sale stock (${saleStock}) cannot exceed the medicine's total available stock (${medicine.stock}).`
    );
  }

  // ── Guard: discountPrice must be less than originalPrice ────────────────────
  if (Number(discountPrice) >= medicine.price) {
    throw new AppError(
      status.BAD_REQUEST,
      `Discount price (${discountPrice}) must be lower than the original price (${medicine.price}).`
    );
  }

  const sale = await prisma.flashSale.create({
    data: {
      medicineId, sellerId: req.user.id,
      originalPrice: medicine.price,
      discountPrice: Number(discountPrice),
      saleStock: Number(saleStock),
      startAt: new Date(startAt), endAt: new Date(endAt),
    },
    include: { medicine: { select: { id: true, name: true, image: true, price: true } } },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: "Flash sale submitted for approval", data: sale });
}));

// DELETE /api/flash-sales/admin/:id — admin removes any flash sale
// ⚠️ Must be declared BEFORE DELETE /:id, otherwise Express matches /admin/:id
//    with the /:id wildcard first (id = "admin") and the auth(["SELLER"]) guard
//    rejects the admin before this handler is ever reached.
router.delete("/admin/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const sale = await prisma.flashSale.findUnique({ where: { id: req.params.id } });
  if (!sale) throw new AppError(status.NOT_FOUND, "Flash sale not found");
  await prisma.flashSale.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Flash sale removed", data: null });
}));

// DELETE /api/flash-sales/:id — seller cancels pending
router.delete("/:id", auth(["SELLER"]), catchAsync(async (req: Request, res: Response) => {
  const sale = await prisma.flashSale.findUnique({ where: { id: req.params.id } });
  if (!sale) throw new AppError(status.NOT_FOUND, "Flash sale not found");
  if (sale.sellerId !== req.user.id) throw new AppError(status.FORBIDDEN, "Forbidden");
  await prisma.flashSale.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Flash sale cancelled", data: null });
}));

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/flash-sales/admin/all
router.get("/admin/all", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const sales = await prisma.flashSale.findMany({
    include: {
      medicine: { select: { id: true, name: true, image: true, price: true } },
      seller:   { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "All flash sales", data: sales });
}));

// PATCH /api/flash-sales/admin/:id — approve/reject
router.patch("/admin/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { isApproved, adminNote } = req.body;
  const sale = await prisma.flashSale.update({
    where: { id: req.params.id },
    data: { isApproved, adminNote },
    include: { medicine: { select: { id: true, name: true } } },
  });
  sendResponse(res, { status: status.OK, success: true, message: `Flash sale ${isApproved ? "approved" : "rejected"}`, data: sale });
}));


export const flashSaleRouter = router;
