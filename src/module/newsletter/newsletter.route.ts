import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import auth from "../../middleware/auth.middleware";
import status from "http-status";

const router = Router();

// POST /api/newsletter/subscribe
router.post("/subscribe", catchAsync(async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return sendResponse(res, { status: status.BAD_REQUEST, success: false, message: "Valid email required", data: null });

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing)
    return sendResponse(res, { status: status.CONFLICT, success: false, message: "Already subscribed", data: null });

  const sub = await prisma.newsletterSubscriber.create({ data: { email, name } });
  sendResponse(res, { status: status.CREATED, success: true, message: "Subscribed successfully", data: sub });
}));

// GET /api/newsletter (ADMIN)
router.get("/", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "desc" } });
  sendResponse(res, { status: status.OK, success: true, message: "Subscribers fetched", data: subscribers });
}));

// DELETE /api/newsletter/:id (ADMIN)
router.delete("/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Subscriber removed", data: null });
}));

export const newsletterRouter = router;
