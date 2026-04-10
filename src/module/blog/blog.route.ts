import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import auth from "../../middleware/auth.middleware";
import status from "http-status";

const makeSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const router = Router();

// ── SPECIFIC ROUTES MUST COME BEFORE /:slug ──────────────────────────────────

// GET /api/blogs — published (+ optional featured filter)
router.get("/", catchAsync(async (req: Request, res: Response) => {
  const featured = req.query.featured === "true";
  const limit    = Number(req.query.limit) || 20;
  const blogs = await prisma.blog.findMany({
    where: { isPublished: true, ...(featured ? { isFeatured: true } : {}) },
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  sendResponse(res, { status: status.OK, success: true, message: "Blogs fetched", data: blogs });
}));

// GET /api/blogs/my/list — logged-in user's own blogs (MUST be before /:slug)
router.get("/my/list", auth(), catchAsync(async (req: Request, res: Response) => {
  const blogs = await prisma.blog.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "My blogs", data: blogs });
}));

// GET /api/blogs/admin/all — all blogs including unpublished (MUST be before /:slug)
router.get("/admin/all", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const blogs = await prisma.blog.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "All blogs", data: blogs });
}));

// GET /api/blogs/:slug — single published blog (wildcard MUST be last among GETs)
router.get("/:slug", catchAsync(async (req: Request, res: Response) => {
  const blog = await prisma.blog.findUnique({
    where: { slug: req.params.slug },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  if (!blog || !blog.isPublished) {
    return sendResponse(res, { status: status.NOT_FOUND, success: false, message: "Blog not found", data: null });
  }
  sendResponse(res, { status: status.OK, success: true, message: "Blog fetched", data: blog });
}));

// ── MUTATIONS (method-specific, no ordering conflict with GET /:slug) ─────────

// POST /api/blogs — create (any logged-in user)
router.post("/", auth(), catchAsync(async (req: Request, res: Response) => {
  const { title, summary, content, image, tags } = req.body;
  if (!title || !summary || !content) {
    return sendResponse(res, { status: status.BAD_REQUEST, success: false, message: "title, summary, content required", data: null });
  }
  const baseSlug = makeSlug(title);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.blog.findUnique({ where: { slug } })) { slug = `${baseSlug}-${i++}`; }

  const blog = await prisma.blog.create({
    data: {
      userId: req.user.id, title, slug, summary, content,
      image: image || null,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
    },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: "Blog submitted for review", data: blog });
}));

// PATCH /api/blogs/admin/:id — publish/feature
router.patch("/admin/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { isPublished, isFeatured } = req.body;
  const blog = await prisma.blog.update({
    where: { id: req.params.id },
    data: {
      ...(isPublished !== undefined ? { isPublished, publishedAt: isPublished ? new Date() : null } : {}),
      ...(isFeatured  !== undefined ? { isFeatured }  : {}),
    },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Blog updated", data: blog });
}));

// DELETE /api/blogs/admin/:id
router.delete("/admin/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  await prisma.blog.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Blog deleted", data: null });
}));

export const blogRouter = router;
