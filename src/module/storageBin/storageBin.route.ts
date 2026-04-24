import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { prisma } from "../../lib/prisma";
import status from "http-status";

const router = Router();

// ── Storage Bins ─────────────────────────────────────────────────────
router.post("/", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await prisma.storageBin.create({ data: req.body, include: { location: true } });
  sendResponse(res, { status: status.CREATED, success: true, message: "Bin created", data });
}));

router.get("/:warehouseId", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const warehouseId = req.params.warehouseId as string;
  const data = await prisma.storageBin.findMany({
    where: { warehouseId },
    include: { location: true, allocations: { include: { medicine: { select: { id: true, name: true } } } } },
    orderBy: { binCode: "asc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Bins fetched", data });
}));

// ── Bin Allocation ───────────────────────────────────────────────────
router.post("/allocate", auth(["WAREHOUSE"]), catchAsync(async (req, res) => {
  const { binId, medicineId, quantity } = req.body as { binId: string; medicineId: string; quantity: number };
  const bin = await prisma.storageBin.findUnique({ where: { id: binId } });
  if (!bin) return res.status(404).json({ success: false, message: "Bin not found" });
  if (bin.currentLoad + quantity > bin.capacity) {
    return res.status(400).json({ success: false, message: `Bin capacity exceeded. Available: ${bin.capacity - bin.currentLoad}` });
  }
  const [alloc] = await prisma.$transaction([
    prisma.binAllocation.upsert({
      where: { binId_medicineId: { binId, medicineId } },
      update: { quantity: { increment: quantity } },
      create: { binId, medicineId, quantity },
    }),
    prisma.storageBin.update({
      where: { id: binId },
      data: { currentLoad: { increment: quantity } },
    }),
  ]);
  sendResponse(res, { status: status.OK, success: true, message: "Medicine allocated to bin", data: alloc });
}));

export const storageBinRouter = router;
