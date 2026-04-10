import Stripe from "stripe";
import { Router, Request, Response } from "express";
import auth from "../../middleware/auth.middleware";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });

// POST /api/payments/intent  — create a PaymentIntent
router.post("/intent", auth(["CUSTOMER"]), async (req: Request, res: Response) => {
  try {
    const { amount, currency = "usd" } = req.body;
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ success: false, message: "Valid amount (in cents) is required" });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "STRIPE_SECRET_KEY is not configured" });
    }
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount)),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { userId: String(req.user.id) },
    });
    res.json({
      success: true,
      message: "Payment intent created",
      data: { clientSecret: intent.client_secret, paymentIntentId: intent.id },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Stripe error" });
  }
});

export const paymentRouter = router;
