import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { returnService } from "./return.service";
import status from "http-status";

type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

const submitReturn = catchAsync(async (req: Request, res: Response) => {
  const { orderId, reason } = req.body;
  if (!orderId || !reason) throw new AppError(status.BAD_REQUEST, "orderId and reason are required");
  const data = await returnService.submitReturn(req.user.id, orderId, reason);
  sendResponse(res, { status: status.CREATED, success: true, message: "Return request submitted", data });
});

const getMyReturns = catchAsync(async (req: Request, res: Response) => {
  const data = await returnService.getMyReturns(req.user.id);
  sendResponse(res, { status: status.OK, success: true, message: "Returns fetched", data });
});

const getAllReturns = catchAsync(async (req: Request, res: Response) => {
  const returnStatus = req.query.status as ReturnStatus | undefined;
  const data = await returnService.getAllReturns(returnStatus);
  sendResponse(res, { status: status.OK, success: true, message: "All returns fetched", data });
});

const updateReturnStatus = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status: returnStatus, adminNote } = req.body;
  if (!returnStatus) throw new AppError(status.BAD_REQUEST, "status is required");
  const data = await returnService.updateReturnStatus(id, returnStatus as ReturnStatus, adminNote);
  sendResponse(res, { status: status.OK, success: true, message: "Return updated", data });
});

export const returnController = { submitReturn, getMyReturns, getAllReturns, updateReturnStatus };
