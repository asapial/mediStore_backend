import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import auth from "../../middleware/auth.middleware";
import status from "http-status";

const router = Router();

// GET /api/testimonials?approved=true
router.get("/", catchAsync(async (req: Request, res: Response) => {
  const approved  = req.query.approved  === "true" ? true : undefined;
  const featured  = req.query.featured  === "true" ? true : undefined;
  const limit     = Number(req.query.limit) || 50;
  const testimonials = await prisma.testimonial.findMany({
    where: {
      ...(approved  !== undefined ? { isApproved: approved }  : {}),
      ...(featured  !== undefined ? { isFeatured: featured }  : {}),
    },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  sendResponse(res, { status: status.OK, success: true, message: "Testimonials fetched", data: testimonials });
}));

// POST /api/testimonials — logged-in user submission
router.post("/", auth(), catchAsync(async (req: Request, res: Response) => {
  const { content, rating } = req.body;
  if (!content) return sendResponse(res, { status: status.BAD_REQUEST, success: false, message: "content required", data: null });
  const t = await prisma.testimonial.create({
    data: { userId: req.user.id, content, rating: Math.min(5, Math.max(1, Number(rating) || 5)) },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: "Testimonial submitted for review", data: t });
}));

// ADMIN — GET all
router.get("/admin/all", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const testimonials = await prisma.testimonial.findMany({
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "All testimonials", data: testimonials });
}));

// ADMIN — PATCH (approve/feature)
router.patch("/admin/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { isApproved, isFeatured } = req.body;
  const t = await prisma.testimonial.update({
    where: { id: req.params.id },
    data: {
      ...(isApproved !== undefined ? { isApproved } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Testimonial updated", data: t });
}));

// ADMIN — DELETE
router.delete("/admin/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Testimonial deleted", data: null });
}));

export const testimonialRouter = router;
