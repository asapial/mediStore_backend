import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { prisma } from "../../lib/prisma";
import status from "http-status";

const router = Router();

// ── Suppliers ────────────────────────────────────────────────────────
router.post("/", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await prisma.supplier.create({ data: req.body });
  sendResponse(res, { status: status.CREATED, success: true, message: "Supplier created", data });
}));

router.get("/", auth(["ADMIN", "WAREHOUSE", "SELLER"]), catchAsync(async (_req, res) => {
  const data = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  sendResponse(res, { status: status.OK, success: true, message: "Suppliers fetched", data });
}));

router.patch("/:id", auth(["ADMIN"]), catchAsync(async (req, res) => {
  const data = await prisma.supplier.update({ where: { id: req.params.id as string }, data: req.body });
  sendResponse(res, { status: status.OK, success: true, message: "Supplier updated", data });
}));

// ── Shipments ────────────────────────────────────────────────────────
router.post("/shipments", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await prisma.supplierShipment.create({
    data: { ...req.body, expectedAt: new Date(req.body.expectedAt) },
    include: { supplier: true, warehouse: { select: { id: true, name: true } } },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: "Shipment created", data });
}));

router.get("/shipments", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const warehouseId = req.query.warehouseId as string | undefined;
  const data = await prisma.supplierShipment.findMany({
    where: warehouseId ? { warehouseId } : {},
    include: {
      supplier:  { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: { expectedAt: "asc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Shipments fetched", data });
}));

router.patch("/shipments/:id/receive", auth(["WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await prisma.supplierShipment.update({
    where: { id: req.params.id as string },
    data: { status: "RECEIVED", receivedAt: new Date() },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Shipment marked received", data });
}));

export const supplierRouter = router;
