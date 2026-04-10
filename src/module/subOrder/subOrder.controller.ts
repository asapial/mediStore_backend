import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { subOrderService } from "./subOrder.service";
import status from "http-status";

const getSellerSubOrders = catchAsync(async (req: Request, res: Response) => {
  const data = await subOrderService.getSellerSubOrders(req.user.id);
  sendResponse(res, { status: status.OK, success: true, message: "Sub-orders fetched", data });
});

const getOrderSubOrders = catchAsync(async (req: Request, res: Response) => {
  const data = await subOrderService.getOrderSubOrders(String(req.params.orderId), req.user.id);
  sendResponse(res, { status: status.OK, success: true, message: "Order sub-orders fetched", data });
});

const updateSubOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { status: orderStatus } = req.body;
  const data = await subOrderService.updateSubOrderStatus(String(req.params.id), req.user.id, orderStatus);
  sendResponse(res, { status: status.OK, success: true, message: "Sub-order updated", data });
});

export const subOrderController = { getSellerSubOrders, getOrderSubOrders, updateSubOrderStatus };
