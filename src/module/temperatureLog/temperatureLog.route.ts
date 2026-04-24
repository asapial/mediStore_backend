import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { prisma } from "../../lib/prisma";
import status from "http-status";

const router = Router();

// POST — log a temperature reading
router.post("/", auth(["WAREHOUSE"]), catchAsync(async (req, res) => {
  const { warehouseId, zone, temperature, minAllowed, maxAllowed } = req.body as {
    warehouseId: string; zone: string; temperature: number; minAllowed?: number; maxAllowed?: number;
  };
  const isAlert = temperature < (minAllowed ?? 2) || temperature > (maxAllowed ?? 8);
  const data = await prisma.temperatureLog.create({
    data: {
      warehouseId, zone, temperature,
      minAllowed: minAllowed ?? 2,
      maxAllowed: maxAllowed ?? 8,
      isAlert, recordedById: req.user!.id,
    },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: isAlert ? "⚠️ ALERT: Temperature out of range!" : "Temperature logged", data });
}));

// GET — list logs for a warehouse with optional zone filter
router.get("/:warehouseId", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const warehouseId  = req.params.warehouseId as string;
  const zone         = req.query.zone as string | undefined;
  const alertsOnly   = req.query.alertsOnly === "true";
  const data = await prisma.temperatureLog.findMany({
    where: {
      warehouseId,
      ...(zone        ? { zone }        : {}),
      ...(alertsOnly  ? { isAlert: true } : {}),
    },
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { recordedAt: "desc" },
    take: 200,
  });
  sendResponse(res, { status: status.OK, success: true, message: "Temperature logs fetched", data });
}));

export const temperatureLogRouter = router;
