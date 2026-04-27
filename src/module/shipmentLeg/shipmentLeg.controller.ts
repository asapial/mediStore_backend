import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { shipmentLegService } from "./shipmentLeg.service";

// GET /api/shipment-legs?warehouseId=xxx   (WAREHOUSE role — their legs)
// GET /api/shipment-legs                   (ADMIN — all legs)
const getLegs = catchAsync(async (req: Request, res: Response) => {
  const warehouseId = req.query.warehouseId as string | undefined;
  const filterStatus = req.query.status as string | undefined;

  const data = warehouseId
    ? await shipmentLegService.getLegsForWarehouse(warehouseId)
    : await shipmentLegService.getAllLegs(filterStatus);

  sendResponse(res, { status: status.OK, success: true, message: "Shipment legs fetched", data });
});

// GET /api/shipment-legs/mine  (auto-resolves warehouse from authenticated user)
const getMyLegs = catchAsync(async (req: Request, res: Response) => {
  const data = await shipmentLegService.getLegsForUser(req.user!.id);
  sendResponse(res, { status: status.OK, success: true, message: "Shipment legs fetched", data });
});

// PATCH /api/shipment-legs/:id/receive-at-origin
const receiveAtOrigin = catchAsync(async (req: Request, res: Response) => {
  const data = await shipmentLegService.receiveAtOrigin(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Items received at origin warehouse", data });
});

// PATCH /api/shipment-legs/:id/dispatch
const dispatchToDestination = catchAsync(async (req: Request, res: Response) => {
  const data = await shipmentLegService.dispatchToDestination(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Shipment dispatched to destination warehouse", data });
});

// PATCH /api/shipment-legs/:id/receive-at-dest
const receiveAtDest = catchAsync(async (req: Request, res: Response) => {
  const data = await shipmentLegService.receiveAtDest(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Items received at destination warehouse", data });
});

export const shipmentLegController = {
  getLegs,
  getMyLegs,
  receiveAtOrigin,
  dispatchToDestination,
  receiveAtDest,
};
