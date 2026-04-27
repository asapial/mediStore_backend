import express from "express";
import { shipmentLegController } from "./shipmentLeg.controller";
import auth from "../../middleware/auth.middleware";

const router = express.Router();

// /mine MUST be before /:id to avoid conflicts
// GET /api/shipment-legs/mine (auto-resolves warehouse from authenticated user)
router.get("/mine", auth(["ADMIN", "WAREHOUSE"]), shipmentLegController.getMyLegs);

// List legs for a warehouse (WAREHOUSE role passes ?warehouseId=) or all (ADMIN)
router.get("/", auth(["ADMIN", "WAREHOUSE"]), shipmentLegController.getLegs);

// Origin WH confirms items received from seller
router.patch("/:id/receive-at-origin", auth(["WAREHOUSE"]), shipmentLegController.receiveAtOrigin);

// Origin WH dispatches package to destination WH
router.patch("/:id/dispatch", auth(["WAREHOUSE"]), shipmentLegController.dispatchToDestination);

// Destination WH confirms arrival
router.patch("/:id/receive-at-dest", auth(["WAREHOUSE"]), shipmentLegController.receiveAtDest);

export const shipmentLegRouter = router;
