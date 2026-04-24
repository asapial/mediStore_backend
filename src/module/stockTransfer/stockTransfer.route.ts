import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { stockTransferService } from "./stockTransfer.service";
import status from "http-status";

const router = Router();

router.post("/", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await stockTransferService.createTransfer({ ...req.body, requestedById: req.user!.id });
  sendResponse(res, { status: status.CREATED, success: true, message: "Transfer created", data });
}));

router.get("/", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const warehouseId = req.query.warehouseId as string | undefined;
  const data = await stockTransferService.listTransfers(warehouseId);
  sendResponse(res, { status: status.OK, success: true, message: "Transfers fetched", data });
}));

router.patch("/:id/approve", auth(["ADMIN"]), catchAsync(async (req, res) => {
  const data = await stockTransferService.approveTransfer(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Transfer approved (IN_TRANSIT)", data });
}));

router.patch("/:id/complete", auth(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
  const data = await stockTransferService.completeTransfer(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Transfer completed — stock moved", data });
}));

router.patch("/:id/cancel", auth(["ADMIN"]), catchAsync(async (req, res) => {
  const data = await stockTransferService.cancelTransfer(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Transfer cancelled", data });
}));

export const stockTransferRouter = router;
