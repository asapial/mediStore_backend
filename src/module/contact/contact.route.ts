import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import auth from "../../middleware/auth.middleware";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

const router = Router();

// POST /api/contact — public submission
router.post("/", catchAsync(async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message)
    throw new AppError(status.BAD_REQUEST, "name, email, message are required");

  const msg = await prisma.contactMessage.create({
    data: { name, email, subject: subject || null, message },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: "Message sent successfully", data: msg });
}));

// GET /api/contact/my — authenticated customer views own tickets
router.get("/my", auth(["CUSTOMER"]), catchAsync(async (req: Request, res: Response) => {
  const email = req.user.email;
  const messages = await prisma.contactMessage.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Your tickets fetched", data: messages });
}));

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/contact/admin/messages
router.get("/admin/messages", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const statusFilter = req.query.status as string | undefined;
  const messages = await prisma.contactMessage.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Messages fetched", data: messages });
}));

// PATCH /api/contact/admin/:id/status — mark read/archived
router.patch("/admin/:id/status", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { status: newStatus } = req.body;
  if (!["UNREAD","READ","ARCHIVED"].includes(newStatus))
    throw new AppError(status.BAD_REQUEST, "Invalid status");
  const msg = await prisma.contactMessage.update({
    where: { id: req.params.id },
    data: { status: newStatus },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Status updated", data: msg });
}));

// POST /api/contact/admin/:id/reply — reply via email (sends reply and stores it)
router.post("/admin/:id/reply", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { reply } = req.body;
  if (!reply) throw new AppError(status.BAD_REQUEST, "reply text required");

  const msg = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
  if (!msg) throw new AppError(status.NOT_FOUND, "Message not found");

  // Update the stored reply
  const updated = await prisma.contactMessage.update({
    where: { id: req.params.id },
    data: { adminReply: reply, repliedAt: new Date(), status: "READ" },
  });

  // Send email via nodemailer if configured
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"MediStore Support" <${process.env.SMTP_USER}>`,
      to: msg.email,
      subject: `Re: ${msg.subject || "Your inquiry"} — MediStore`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
          <div style="background:#1B3A5C;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">💊 MediStore</h1>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#5C4033;">Dear <strong>${msg.name}</strong>,</p>
            <p style="color:#5C4033;">Thank you for contacting us. Here is our response to your inquiry:</p>
            <blockquote style="background:#F5EDE3;border-left:4px solid #C2703A;padding:16px;border-radius:4px;color:#1B3A5C;font-style:italic;">
              ${reply.replace(/\n/g, "<br>")}
            </blockquote>
            <p style="color:#5C4033;margin-top:16px;">Your original message:</p>
            <blockquote style="background:#f5f5f5;border-left:4px solid #ccc;padding:12px;color:#888;font-size:13px;">
              ${msg.message.replace(/\n/g, "<br>")}
            </blockquote>
            <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
            <p style="color:#8A6650;font-size:12px;">MediStore — Your Trusted Online Pharmacy<br>support@medistore.com</p>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("Email send failed (reply stored anyway):", emailErr);
  }

  sendResponse(res, { status: status.OK, success: true, message: "Reply sent and stored", data: updated });
}));

// DELETE /api/contact/admin/:id
router.delete("/admin/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Message deleted", data: null });
}));

export const contactRouter = router;
