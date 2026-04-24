import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { prisma } from "../../lib/prisma";
import status from "http-status";

const router = Router();

router.get("/:warehouseId", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const warehouseId = req.params.warehouseId as string;

  const [
    stockCount, stockSum, fulfillmentStats, expiryCount,
    transferCount, grnCount, tempAlerts, topMedicines,
  ] = await Promise.all([
    // Count unique SKUs
    prisma.locationStock.count({ where: { warehouseId } }),
    // Sum total units
    prisma.locationStock.aggregate({ where: { warehouseId }, _sum: { quantity: true } }),
    // Fulfillment breakdown by status
    prisma.fulfillmentTask.groupBy({
      by: ["status"],
      where: { warehouseId },
      _count: true,
    }),
    // Active expiry alerts
    prisma.expiryAlert.count({ where: { warehouseId, isResolved: false } }),
    // Transfer count (in + out)
    prisma.stockTransfer.count({
      where: { OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }] },
    }),
    // GRN count
    prisma.goodsReceiptNote.count({ where: { warehouseId } }),
    // Temperature alerts (last 7 days)
    prisma.temperatureLog.count({
      where: {
        warehouseId,
        isAlert: true,
        recordedAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    }),
    // Top 5 stocked medicines
    prisma.locationStock.findMany({
      where: { warehouseId },
      orderBy: { quantity: "desc" },
      take: 5,
      include: { medicine: { select: { id: true, name: true, price: true, image: true } } },
    }),
  ]);

  const data = {
    totalSkus:    stockCount,
    totalUnits:   stockSum._sum.quantity ?? 0,
    fulfillment:  Object.fromEntries(fulfillmentStats.map(f => [f.status, f._count])),
    expiryAlerts: expiryCount,
    transfers:    transferCount,
    grns:         grnCount,
    tempAlerts7d: tempAlerts,
    topMedicines,
  };

  sendResponse(res, { status: status.OK, success: true, message: "Analytics fetched", data });
}));

export const warehouseAnalyticsRouter = router;
