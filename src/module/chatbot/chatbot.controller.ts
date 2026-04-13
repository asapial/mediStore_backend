import { Request, Response } from "express";
import { catchAsync }         from "../../utils/catchAsync";
import { sendResponse }       from "../../utils/sendResponse";
import { auth as betterAuth } from "../../lib/auth";
import { chatbotService }     from "./chatbot.service";

const GUEST_LIMIT = 4;

interface IncomingMessage {
    role: "user" | "assistant";
    content: string;
}

const chat = catchAsync(async (req: Request, res: Response) => {
    // ── Optional auth ──────────────────────────────────────────────────────────
    let userId: string | undefined;
    let userRole: string | undefined;
    let userName: string | undefined;

    try {
        const session = await betterAuth.api.getSession({ headers: req.headers as any });
        if (session?.user) {
            userId   = session.user.id;
            userRole = (session.user as any).role ?? "CUSTOMER";
            userName = session.user.name;
        }
    } catch {
        // Guest — no session
    }

    const isGuest = !userId;

    // ── Parse body ─────────────────────────────────────────────────────────────
    const { messages, guestCount } = req.body as {
        messages: IncomingMessage[];
        guestCount?: number;
    };

    // ── Guest limit ────────────────────────────────────────────────────────────
    if (isGuest && typeof guestCount === "number" && guestCount >= GUEST_LIMIT) {
        return sendResponse(res, {
            status:  403,
            success: false,
            message: `Guest chat limit of ${GUEST_LIMIT} messages reached. Please sign in for unlimited access.`,
        });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        return sendResponse(res, {
            status:  400,
            success: false,
            message: "messages array is required and must not be empty.",
        });
    }

    // Strip system messages injected by client (security), keep only user/assistant
    const sanitised = messages
        .filter((m: IncomingMessage) => m.role === "user" || m.role === "assistant")
        .slice(-20);

    // Extract latest user message + history before it
    const lastMsg = sanitised.at(-1);

    if (!lastMsg) {
        return sendResponse(res, { status: 400, success: false, message: "No messages provided." });
    }

    if (lastMsg.role !== "user") {
        return sendResponse(res, {
            status:  400,
            success: false,
            message: "Last message must be from the user.",
        });
    }

    const currentMessage = lastMsg.content;
    const history        = sanitised.slice(0, -1);

    // ── Call AI service ────────────────────────────────────────────────────────
    let content: string;

    if (isGuest) {
        content = await chatbotService.guestChat(currentMessage, history);
    } else {
        content = await chatbotService.chatWithAI(
            userId!,
            userRole!,
            userName!,
            currentMessage,
            history,
        );
    }

    return sendResponse(res, {
        status:  200,
        success: true,
        message: "Chat response generated",
        data: {
            content,
            isGuest,
            role: userRole ?? null,
        },
    });
});

export const chatbotController = { chat };
