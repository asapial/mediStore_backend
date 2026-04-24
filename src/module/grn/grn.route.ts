import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { grnService } from "./grn.service";
import status from "http-status";

const router = Router();

router.post("/", auth(["WAREHOUSE", "SELLER"]), catchAsync(async (req, res) => {
  const data = await grnService.createGRN({ ...req.body, receivedById: req.user!.id });
  sendResponse(res, { status: status.CREATED, success: true, message: "GRN created", data });
}));

router.get("/", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await grnService.listGRNs(req.query.warehouseId as string | undefined);
  sendResponse(res, { status: status.OK, success: true, message: "GRNs fetched", data });
}));

router.get("/:id", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await grnService.getGRN(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "GRN fetched", data });
}));

router.patch("/:id/verify", auth(["WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await grnService.verifyGRN(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "GRN verified — stock updated", data });
}));

export const grnRouter = router;
