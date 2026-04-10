import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { notificationController } from "./notification.controller";

const router = Router();

// Notifications (all logged-in users)
router.get("/", auth(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.getMyNotifications);
router.get("/unread-count", auth(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.getUnreadCount);
router.patch("/read-all", auth(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.markAsRead);
router.patch("/:id/read", auth(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.markAsRead);

// Order Tracking
router.get("/tracking/:orderId", auth(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.getOrderTracking);
router.post("/tracking", auth(["SELLER", "ADMIN"]), notificationController.addTrackingEvent);

export const notificationRouter = router;
