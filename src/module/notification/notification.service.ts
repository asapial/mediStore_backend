import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

type NotificationType = "ORDER_UPDATE" | "LOW_STOCK" | "SUBSCRIPTION_REFILL" | "SYSTEM" | "RETURN_UPDATE";

// ─── Create a notification for a user ────────────────────────────────────────
const createNotification = async (
  userId: string,
  title: string,
  body: string,
  type: NotificationType = "SYSTEM"
) => {
  return prisma.notification.create({
    data: { userId, title, body, type },
  });
};

// ─── Get notifications for a user ─────────────────────────────────────────────
const getMyNotifications = async (userId: string, unreadOnly = false) => {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

// ─── Mark one or all as read ──────────────────────────────────────────────────
const markAsRead = async (userId: string, notificationId?: string) => {
  if (notificationId) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
  // Mark all
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

// ─── Get unread count ─────────────────────────────────────────────────────────
const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};

// ─── Get order tracking timeline ──────────────────────────────────────────────
const getOrderTracking = async (orderId: string) => {
  return prisma.orderTracking.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
};

// ─── Add tracking event (seller / system) ────────────────────────────────────
const addTrackingEvent = async (
  orderId: string,
  trackingStatus: string,
  note?: string
) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(status.NOT_FOUND, "Order not found");

  const event = await prisma.orderTracking.create({
    data: {
      orderId,
      status: trackingStatus as any,
      ...(note !== undefined ? { note } : {}),
    },
  });

  // Notify the customer
  await createNotification(
    order.userId,
    `Order ${trackingStatus.replace(/_/g, " ")}`,
    note ?? `Your order status has been updated to ${trackingStatus}`,
    "ORDER_UPDATE"
  );

  return event;
};

export const notificationService = {
  createNotification,
  getMyNotifications,
  markAsRead,
  getUnreadCount,
  getOrderTracking,
  addTrackingEvent,
};
