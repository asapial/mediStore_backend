import { Router } from "express";
import { chatbotController } from "./chatbot.controller";

const router = Router();

// POST /api/chatbot/chat
// Open to all — optional auth handled inside controller
router.post("/chat", chatbotController.chat);

export const chatbotRouter = router;
