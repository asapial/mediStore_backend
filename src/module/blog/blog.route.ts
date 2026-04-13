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

// PUT /api/blogs/:id — author edits their own blog (resets to pending review)
router.put("/:id", auth(), catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, summary, content, image, tags } = req.body;

  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) {
    return sendResponse(res, { status: status.NOT_FOUND, success: false, message: "Blog not found", data: null });
  }
  // Only the author (or admin) can edit
  if (existing.userId !== req.user.id && req.user.role !== "ADMIN") {
    return sendResponse(res, { status: status.FORBIDDEN, success: false, message: "Not authorized to edit this blog", data: null });
  }

  // If a non-admin edits, reset to pending review
  const shouldReset = req.user.role !== "ADMIN";

  // Re-generate slug if title changed
  let slug = existing.slug;
  if (title && title.trim() !== existing.title) {
    const baseSlug = makeSlug(title.trim());
    slug = baseSlug;
    let i = 1;
    while (await prisma.blog.findFirst({ where: { slug, NOT: { id } } })) { slug = `${baseSlug}-${i++}`; }
  }

  const blog = await prisma.blog.update({
    where: { id },
    data: {
      ...(title   ? { title: title.trim(), slug } : {}),
      ...(summary ? { summary: summary.trim() }   : {}),
      ...(content ? { content: content.trim() }   : {}),
      image: image !== undefined ? (image || null) : existing.image,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : existing.tags),
      ...(shouldReset ? { isPublished: false, isFeatured: false, publishedAt: null } : {}),
    },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  sendResponse(res, { status: status.OK, success: true, message: shouldReset ? "Blog updated — pending admin review" : "Blog updated", data: blog });
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
