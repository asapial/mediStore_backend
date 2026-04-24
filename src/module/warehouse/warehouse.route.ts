import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { warehouseController } from "./warehouse.controller";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { locationStockService } from "./locationStock.service";
import status from "http-status";

const router = Router();

// ── Warehouse CRUD ──────────────────────────────────────────────────
router.post("/",    auth(["ADMIN"]),               warehouseController.createWarehouse);
router.get("/",     auth(["ADMIN", "WAREHOUSE"]),  warehouseController.listWarehouses);
router.get("/nearest",                             warehouseController.getNearestWarehouses); // public
router.get("/:id",  auth(["ADMIN", "WAREHOUSE"]), warehouseController.getWarehouse);
router.patch("/:id", auth(["ADMIN"]),              warehouseController.updateWarehouse);

// ── Locations ───────────────────────────────────────────────────────
router.post("/locations/add", auth(["ADMIN", "WAREHOUSE"]), warehouseController.addLocation);
router.get("/:warehouseId/locations", auth(["ADMIN", "WAREHOUSE"]), warehouseController.listLocations);

// ── Location Stock ──────────────────────────────────────────────────
router.get("/:warehouseId/stock", auth(["ADMIN", "WAREHOUSE"]),
  catchAsync(async (req, res) => {
    const data = await locationStockService.getStock(req.params.warehouseId as string);
    sendResponse(res, { status: status.OK, success: true, message: "Stock fetched", data });
  })
);

router.post("/stock/adjust", auth(["ADMIN", "WAREHOUSE"]),
  catchAsync(async (req, res) => {
    const { warehouseId, medicineId, delta } = req.body as {
      warehouseId: string; medicineId: string; delta: number;
    };
    const data = await locationStockService.adjustStock(warehouseId, medicineId, delta);
    sendResponse(res, { status: status.OK, success: true, message: "Stock adjusted", data });
  })
);

export const warehouseRouter = router;
