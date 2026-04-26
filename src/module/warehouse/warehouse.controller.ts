import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { warehouseService } from "./warehouse.service";
import status from "http-status";

const createWarehouse = catchAsync(async (req: Request, res: Response) => {
  const data = await warehouseService.createWarehouse(req.body);
  sendResponse(res, { status: status.CREATED, success: true, message: "Warehouse created", data });
});

const listWarehouses = catchAsync(async (req: Request, res: Response) => {
  // Admin sees ALL warehouses (active + inactive); warehouse role sees only active
  const showAll = req.user?.role === "ADMIN";
  const data = await warehouseService.listWarehouses(showAll);
  sendResponse(res, { status: status.OK, success: true, message: "Warehouses fetched", data });
});

const getWarehouse = catchAsync(async (req: Request, res: Response) => {
  const data = await warehouseService.getWarehouse(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Warehouse fetched", data });
});

const updateWarehouse = catchAsync(async (req: Request, res: Response) => {
  const data = await warehouseService.updateWarehouse(req.params.id as string, req.body);
  sendResponse(res, { status: status.OK, success: true, message: "Warehouse updated", data });
});

const getNearestWarehouses = catchAsync(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, message: "lat and lng query params are required" });
  }
  const data = await warehouseService.getNearestWarehouses(lat, lng);
  sendResponse(res, { status: status.OK, success: true, message: "Nearest warehouses", data });
});

const addLocation = catchAsync(async (req: Request, res: Response) => {
  const data = await warehouseService.addLocation(req.body);
  sendResponse(res, { status: status.CREATED, success: true, message: "Location added", data });
});

const listLocations = catchAsync(async (req: Request, res: Response) => {
  const data = await warehouseService.listLocations(req.params.warehouseId as string);
  sendResponse(res, { status: status.OK, success: true, message: "Locations fetched", data });
});

const deleteWarehouse = catchAsync(async (req: Request, res: Response) => {
  await warehouseService.deleteWarehouse(req.params.id as string);
  sendResponse(res, { status: status.OK, success: true, message: "Warehouse deleted and manager role reverted to CUSTOMER", data: null });
});

// ── Location Change Requests ──────────────────────────────────────────────────

const submitLocationRequest = catchAsync(async (req: Request, res: Response) => {
  const data = await warehouseService.submitLocationRequest(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  sendResponse(res, { status: status.CREATED, success: true, message: "Location change request submitted. Awaiting admin approval.", data });
});

const listLocationRequests = catchAsync(async (req: Request, res: Response) => {
  const filterStatus = req.query.status as string | undefined;
  const data = await warehouseService.listLocationRequests(filterStatus);
  sendResponse(res, { status: status.OK, success: true, message: "Location requests fetched", data });
});

const reviewLocationRequest = catchAsync(async (req: Request, res: Response) => {
  const { action, adminNote } = req.body as { action: "APPROVED" | "REJECTED"; adminNote?: string };
  if (!["APPROVED", "REJECTED"].includes(action))
    return res.status(400).json({ success: false, message: "action must be APPROVED or REJECTED" });

  const data = await warehouseService.reviewLocationRequest(
    req.params.reqId as string,
    req.user!.id,
    action,
    adminNote
  );
  sendResponse(res, { status: status.OK, success: true, message: `Request ${action.toLowerCase()}`, data });
});

export const warehouseController = {
  createWarehouse, listWarehouses, getWarehouse, updateWarehouse,
  deleteWarehouse, getNearestWarehouses, addLocation, listLocations,
  submitLocationRequest, listLocationRequests, reviewLocationRequest,
};
