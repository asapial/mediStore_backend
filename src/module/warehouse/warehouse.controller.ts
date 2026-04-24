import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { warehouseService } from "./warehouse.service";
import status from "http-status";

const createWarehouse = catchAsync(async (req: Request, res: Response) => {
  const data = await warehouseService.createWarehouse(req.body);
  sendResponse(res, { status: status.CREATED, success: true, message: "Warehouse created", data });
});

const listWarehouses = catchAsync(async (_req: Request, res: Response) => {
  const data = await warehouseService.listWarehouses();
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

export const warehouseController = {
  createWarehouse, listWarehouses, getWarehouse, updateWarehouse,
  getNearestWarehouses, addLocation, listLocations,
};
