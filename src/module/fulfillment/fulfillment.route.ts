import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { fulfillmentService } from "./fulfillment.service";
import { prisma } from "../../lib/prisma";
import status from "http-status";

const router = Router();

// ── My queue (any WAREHOUSE user — falls back to ALL tasks if not a manager) ──
router.get("/my-queue", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const data = await fulfillmentService.getMyQueue(req.user!.id);
  sendResponse(res, { status: status.OK, success: true, message: "My queue fetched", data });
}));

// ── Queue by warehouseId ──────────────────────────────────────────────────────
router.get("/queue/:warehouseId", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const data = await fulfillmentService.getQueue(req.params.warehouseId as string);
  sendResponse(res, { status: status.OK, success: true, message: "Queue fetched", data });
}));

// ── Assign task (by orderId + warehouseId in body) ───────────────────────────
router.post("/assign", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const { orderId, warehouseId, assignedToId } = req.body;
  const data = await fulfillmentService.assignTask(orderId, warehouseId, assignedToId || req.user!.id);
  sendResponse(res, { status: status.OK, success: true, message: "Task assigned", data });
}));

// ── Pick (start picking an existing task by taskId) ───────────────────────────
router.patch("/:taskId/pick", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const task = await prisma.fulfillmentTask.findUnique({
    where: { id: req.params.taskId as string },
  });
  if (!task) {
    return sendResponse(res, { status: status.NOT_FOUND, success: false, message: "Task not found", data: null });
  }
  const data = await fulfillmentService.assignTask(task.orderId, task.warehouseId, req.user!.id);
  sendResponse(res, { status: status.OK, success: true, message: "Picking started", data });
}));

// ── Receive seller shipment at warehouse (tracked in PackingSlip JSON) ────────
router.patch("/:taskId/receive-seller/:subOrderId", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const data = await fulfillmentService.receiveSellerItems(
    req.params.taskId     as string,
    req.params.subOrderId as string,
    req.user!.id,          // passed as packedBy for PackingSlip
  );
  sendResponse(res, {
    status: status.OK, success: true,
    message: data.allReceived
      ? "All seller items received — order ready to pack!"
      : `Received ${data.receivedCount}/${data.totalCount} seller shipments`,
    data,
  });
}));

// ── Pack ──────────────────────────────────────────────────────────────────────
router.patch("/:taskId/pack", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const data = await fulfillmentService.packTask(
    req.params.taskId as string,
    req.user!.id,
    req.body.items || [],
  );
  sendResponse(res, { status: status.OK, success: true, message: "Packed — packing slip created", data });
}));

// ── Dispatch ──────────────────────────────────────────────────────────────────
router.patch("/:taskId/dispatch", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const data = await fulfillmentService.dispatchTask(req.params.taskId as string);
  sendResponse(res, { status: status.OK, success: true, message: "Dispatched to customer", data });
}));

// ── Mark Delivered → credits seller wallets ───────────────────────────────────
router.patch("/:taskId/deliver", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const data = await fulfillmentService.markDelivered(req.params.taskId as string);
  sendResponse(res, { status: status.OK, success: true, message: "Order delivered. Wallets credited.", data });
}));

// ── Get single task ───────────────────────────────────────────────────────────
router.get("/:taskId", auth(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
  const data = await fulfillmentService.getTask(req.params.taskId as string);
  sendResponse(res, { status: status.OK, success: true, message: "Task fetched", data });
}));

export const fulfillmentRouter = router;
