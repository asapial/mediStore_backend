import { prisma } from "../../lib/prisma";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL          = "google/gemma-3-4b-it:free";
const PLACEHOLDER    = "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";

interface Message {
    role: "user" | "assistant";
    content: string;
}

// ─── Platform Knowledge Base ──────────────────────────────────────────────────
const PLATFORM_KNOWLEDGE = `
════════════════════════════════════
LIFELINE HEALTHCARE PLATFORM — COMPLETE KNOWLEDGE BASE
════════════════════════════════════

## WHAT IS LIFELINE?
LifeLine (also known as MediStore) is a modern online pharmacy platform connecting customers with 
verified sellers (licensed pharmacies) — making quality healthcare accessible and affordable.
- Customers browse, order, and track medicines online.
- Sellers list medicines, manage inventory, and fulfill orders.
- Admins oversee the entire platform — users, compliance, content, and commerce.

## PRODUCTS & SERVICES
- Over-the-counter (OTC) medicines — no prescription needed
- Prescription medicines — customer must upload a valid prescription before checkout
- Health supplements, vitamins & minerals
- Medical devices & personal care products
- Categories: Antibiotics, Cardiovascular, Diabetes, Gastroenterology, Respiratory, Vitamins & Supplements, Dermatology, Pediatrics

## DELIVERY POLICY
- Standard Delivery: 3–5 business days — $2.99 flat fee
- Express Delivery: 1–2 business days — $5.99 flat fee
- FREE delivery on all orders of $50 and above
- Nationwide delivery coverage; real-time order tracking available

## PAYMENT OPTIONS
- LifeLine Wallet (platform credit — topped up via card or bank transfer)
- Credit / Debit card (Stripe-powered, secure checkout)
- Online banking transfer

## RETURNS & REFUNDS
- 7-day return window from delivery date (unopened and undamaged products only)
- Damaged or incorrect items: full refund guaranteed, no questions asked
- Prescription medicines and opened products: non-returnable for safety reasons
- Refunds are credited to LifeLine Wallet within 3–5 business days

## SELLER INFORMATION
- Licensed pharmacies and healthcare businesses can register as sellers
- Pharmacy license verification is mandatory before listing any products
- Sellers manage their own inventory, pricing, and order fulfillment
- Flash sales and custom coupon campaigns available
- License status is reviewed by admin within 2–3 business days

## CUSTOMER FEATURES
- Prescription upload for Rx-only medicines
- Real-time order tracking with live status updates
- Auto-refill subscription service (weekly / bi-weekly / monthly)
- Wishlist to save favourite products
- LifeLine Wallet with full transaction history
- Coupon & discount code support
- Flash sale events with limited-time pricing
- Returns & refund requests through the dashboard

## PAGES & NAVIGATION
- Home: [/]
- Browse medicines: [/medicines]
- Login: [/login]
- Register: [/register]
- Dashboard: [/dashboard]
- My Orders: [/dashboard/customer/orders]
- My Wallet: [/dashboard/customer/wallet]
- Prescriptions: [/dashboard/customer/prescription]
- Wishlist: [/dashboard/customer/wishlist]
- Order Tracking: [/dashboard/customer/tracking]
- Seller dashboard: [/dashboard/seller]
- Seller medicines: [/dashboard/seller/medicines]
- Admin dashboard: [/dashboard/admin]
`.trim();

// ─── Context builders (live DB data per role) ────────────────────────────────
async function buildAdminContext(userId: string): Promise<string> {
    const [users, orders, medicines, pendingLicenses, unreadMessages] = await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.medicine.count(),
        prisma.sellerLicense.count({ where: { status: "PENDING" } }),
        prisma.contactMessage.count({ where: { status: "UNREAD" } }),
    ]);
    const revenue = await prisma.orderItem.aggregate({ _sum: { price: true } });
    return `
LIVE ADMIN DATA:
- Total registered users: ${users}
- Total orders on platform: ${orders}
- Total medicines listed: ${medicines}
- Platform revenue (GMV): $${(revenue._sum.price ?? 0).toFixed(2)}
- Seller licenses pending review: ${pendingLicenses}
- Unread contact messages: ${unreadMessages}
`.trim();
}

async function buildSellerContext(userId: string): Promise<string> {
    const [medicines, orders, lowStock, outOfStock] = await Promise.all([
        prisma.medicine.count({ where: { sellerId: userId } }),
        prisma.order.count({ where: { items: { some: { medicine: { sellerId: userId } } } } }),
        prisma.medicine.count({ where: { sellerId: userId, stock: { gt: 0, lte: 10 } } }),
        prisma.medicine.count({ where: { sellerId: userId, stock: 0 } }),
    ]);
    const revenueAgg = await prisma.orderItem.findMany({
        where: { medicine: { sellerId: userId } },
        select: { price: true, quantity: true },
    });
    const revenue = revenueAgg.reduce((s, i) => s + i.price * i.quantity, 0);
    const license = await prisma.sellerLicense.findUnique({
        where: { sellerId: userId }, select: { status: true },
    });
    return `
LIVE SELLER DATA:
- Medicines listed: ${medicines}
- Total orders received: ${orders}
- Total revenue earned: $${revenue.toFixed(2)}
- Low stock items (≤10 units): ${lowStock}
- Out-of-stock items: ${outOfStock}
- License status: ${license?.status ?? "Not submitted"}
`.trim();
}

async function buildCustomerContext(userId: string): Promise<string> {
    const [totalOrders, activeOrders, wishlistItems, wallet, prescriptions] = await Promise.all([
        prisma.order.count({ where: { userId } }),
        prisma.order.count({ where: { userId, status: { in: ["PLACED", "PROCESSING", "SHIPPED"] } } }),
        prisma.wishlistItem.count({ where: { wishlist: { userId } } }),
        prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
        prisma.prescription.count({ where: { userId } }),
    ]);
    const spendAgg = await prisma.orderItem.findMany({
        where: { order: { userId } }, select: { price: true, quantity: true },
    });
    const totalSpent = spendAgg.reduce((s, i) => s + i.price * i.quantity, 0);
    return `
LIVE CUSTOMER DATA:
- Total orders placed: ${totalOrders}
- Active (in-progress) orders: ${activeOrders}
- Total lifetime spend: $${totalSpent.toFixed(2)}
- Wallet balance: $${(wallet?.balance ?? 0).toFixed(2)}
- Wishlist items saved: ${wishlistItems}
- Prescriptions uploaded: ${prescriptions}
`.trim();
}

// ─── System prompt builders (role-specific) ───────────────────────────────────
function getSystemPrompt(role: string, userName: string, context: string): string {
    const base = `You are LifeLineBot, a professional and friendly AI assistant for LifeLine Healthcare Platform.
The logged-in user is: ${userName}, Role: ${role}

Live account data for this user:
${context}

${PLATFORM_KNOWLEDGE}

General instructions:
- For live data questions (my orders, my wallet, my medicines, etc.) answer from the user's live data above.
- For platform/feature questions, answer from the KNOWLEDGE BASE above.
- Never fabricate or invent data not provided above.
- Be professional, warm, and concise. Keep responses under 150 words unless more detail is needed.
- Use bullet points for lists of steps or features.
- Always recommend consulting a licensed doctor or pharmacist for medical advice.
- IMPORTANT — Actionable links: whenever you reference a page or action, include it as a markdown link using the format [Button Label](/path). Examples:
  - [Go to Dashboard](/dashboard)
  - [My Orders](/dashboard/customer/orders)
  - [Browse Medicines](/medicines)
  - [My Wallet](/dashboard/customer/wallet)
  Never write bare paths — always wrap in markdown link format.
- If you don't know something, say: "I don't have that information right now."`;

    if (role === "ADMIN") {
        return `${base}

Admin-specific instructions:
- Focus on platform-wide statistics, user management, seller compliance, and system health.
- When asked about users, show total counts from live data and link to [User Management](/dashboard/admin/users).
- When asked about pending actions, highlight pending licenses and link to [License Review](/dashboard/admin/license).
- When asked about revenue, show GMV from live data.
- When asked about contact messages, show unread count and link to [Messages](/dashboard/admin/messages).
- Provide proactive insights: "You have X pending licenses to review" etc.`;
    }

    if (role === "SELLER") {
        return `${base}

Seller-specific instructions:
- Focus on inventory, orders, revenue, and compliance.
- When asked about medicines, show listed count and link to [My Medicines](/dashboard/seller/medicines).
- When asked about stock, highlight low/out-of-stock items and link to [Stock Alerts](/dashboard/seller/stock-alerts).
- When asked about orders, show order count and link to [My Orders](/dashboard/seller/orders).
- When asked about revenue, show total from live data.
- When asked about license, show current status and link to [License](/dashboard/seller/license).`;
    }

    if (role === "CUSTOMER") {
        return `${base}

Customer-specific instructions:
- Focus on orders, health, wallet, and shopping.
- When asked about orders, show counts and link to [My Orders](/dashboard/customer/orders).
- When asked about wallet/balance, show live balance and link to [My Wallet](/dashboard/customer/wallet).
- When asked about wishlist, show item count and link to [Wishlist](/dashboard/customer/wishlist).
- When asked about prescriptions, show upload count and link to [Prescriptions](/dashboard/customer/prescription).
- When asked about tracking, link to [Order Tracking](/dashboard/customer/tracking).
- Proactively mention active orders if relevant.`;
    }

    return base;
}

// ─── Authenticated chat ───────────────────────────────────────────────────────
const chatWithAI = async (
    userId: string,
    role: string,
    userName: string,
    message: string,
    history: Message[]
) => {
    const key = process.env.OPENROUTER_API_KEY ?? "";
    if (!key ) {
        throw new Error("AI service is not yet configured. Please add a valid OPENROUTER_API_KEY to the backend .env file.");
    }

    let rawContext = "";
    try {
        if (role === "ADMIN")        rawContext = await buildAdminContext(userId);
        else if (role === "SELLER")  rawContext = await buildSellerContext(userId);
        else                          rawContext = await buildCustomerContext(userId);
    } catch {
        rawContext = `Authenticated ${role} user (live data temporarily unavailable).`;
    }

    const context = rawContext.length > 3000
        ? rawContext.slice(0, 3000) + "\n...(truncated)"
        : rawContext;

    const systemContent = getSystemPrompt(role, userName, context);
    const trimmedHistory = history.slice(-6);

    const fullPrompt = `${systemContent}

Conversation so far:
${trimmedHistory.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")}

User: ${message}
Assistant:`;

    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.frontendBaseUrl ?? "http://localhost:3000",
            "X-Title": "LifeLine Chatbot",
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "user", content: fullPrompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        console.error("OpenRouter error:", JSON.stringify(err, null, 2));
        throw new Error(`AI service error (${response.status})`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim() as string;
};

// ─── Guest chat ───────────────────────────────────────────────────────────────
const guestChat = async (message: string, history: Message[]) => {
    const key = process.env.OPENROUTER_API_KEY ?? "";
    if (!key || key === PLACEHOLDER) {
        throw new Error("AI service is not yet configured. Please add a valid OPENROUTER_API_KEY to the backend .env file.");
    }

    const trimmedHistory = history.slice(-4); // guests get fewer turns

    const fullPrompt = `You are LifeLineBot, a professional and friendly AI assistant for LifeLine Healthcare Platform. You are talking to a guest (not logged in).

${PLATFORM_KNOWLEDGE}

Guest instructions:
- Answer ONLY based on the knowledge above. Never fabricate data.
- Be concise, warm, and professional. Keep responses under 120 words.
- Use bullet points for lists of steps or features.
- If they ask for personal data (their orders, wallet, etc.), tell them to log in first and include [Login](/login).
- After answering, include one relevant actionable link (sign up, browse medicines, login, etc.).
- IMPORTANT — Actionable links: use markdown format [Button Label](/path). Examples:
  - [Sign Up Free](/register)
  - [Login](/login)
  - [Browse Medicines](/medicines)
  - [Learn More](/)
- If you don't know something, say: "I don't have that information right now."

Conversation so far:
${trimmedHistory.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")}

User: ${message}
Assistant:`;

    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.frontendBaseUrl ?? "http://localhost:3000",
            "X-Title": "LifeLine Chatbot",
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "user", content: fullPrompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        console.error("OpenRouter error:", JSON.stringify(err, null, 2));
        throw new Error(`AI service error (${response.status})`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim() as string;
};

export const chatbotService = { chatWithAI, guestChat };
