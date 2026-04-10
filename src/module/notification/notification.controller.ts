import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { notificationService } from "./notification.service";
import status from "http-status";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === "true";
  const data = await notificationService.getMyNotifications(req.user.id, unreadOnly);
  sendResponse(res, { status: status.OK, success: true, message: "Notifications fetched", data });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const data = await notificationService.getUnreadCount(req.user.id);
  sendResponse(res, { status: status.OK, success: true, message: "Unread count", data });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string | undefined;
  const data = await notificationService.markAsRead(req.user.id, id);
  sendResponse(res, { status: status.OK, success: true, message: "Marked as read", data });
});

const getOrderTracking = catchAsync(async (req: Request, res: Response) => {
  const data = await notificationService.getOrderTracking(String(req.params.orderId));
  sendResponse(res, { status: status.OK, success: true, message: "Tracking fetched", data });
});

const addTrackingEvent = catchAsync(async (req: Request, res: Response) => {
  const { orderId, status: trackStatus, note } = req.body;
  const data = await notificationService.addTrackingEvent(orderId, trackStatus, note);
  sendResponse(res, { status: status.CREATED, success: true, message: "Tracking event added", data });
});

export const notificationController = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  getOrderTracking,
  addTrackingEvent,
};
