import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { prisma } from "../../lib/prisma";
import status from "http-status";

const router = Router();

// ── Expiry Alerts ────────────────────────────────────────────────────
router.get("/", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const { warehouseId, days, severity } = req.query;
  const cutoff = days ? new Date(Date.now() + Number(days) * 86400000) : undefined;
  const data = await prisma.expiryAlert.findMany({
    where: {
      ...(warehouseId ? { warehouseId: warehouseId as string } : {}),
      ...(cutoff ? { expiresAt: { lte: cutoff } } : {}),
      ...(severity ? { severity: severity as any } : {}),
      isResolved: false,
    },
    include: {
      medicine:  { select: { id: true, name: true, image: true } },
      warehouse: { select: { id: true, name: true, city: true } },
    },
    orderBy: { daysLeft: "asc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Expiry alerts fetched", data });
}));

router.patch("/:id/resolve", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await prisma.expiryAlert.update({
    where: { id: req.params.id as string },
    data: { isResolved: true },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Alert resolved", data });
}));

export const expiryAlertRouter = router;
