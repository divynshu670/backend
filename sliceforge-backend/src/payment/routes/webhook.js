import express from "express";
import Stripe from "stripe";
import prisma from "../../db/prisma.js";
import { emitOrderUpdate } from "../../socket/socket.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-08-27.basil" });

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !sig) return res.status(400).send("Webhook not configured");

  let event;
  try {
    const rawBody = req.body;
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook verification failed", err?.message);
    return res.status(400).send(`Webhook Error: ${err?.message}`);
  }

  (async () => {
    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const pi = event.data.object;
          const orderId = pi.metadata?.orderId;
          const existing = await prisma.payment.findUnique({ where: { stripeId: pi.id } });
          if (!existing) {
            let resolvedOrderId = orderId;
            if (!resolvedOrderId) {
              const o = await prisma.order.findUnique({ where: { stripePaymentIntent: pi.id } });
              resolvedOrderId = o?.id;
            }
            if (resolvedOrderId) {
              await prisma.order.update({ where: { id: resolvedOrderId }, data: { status: "paid" } });
              emitOrderUpdate({ id: resolvedOrderId, status: "paid" });
            }
            await prisma.payment.create({
              data: {
                orderId: resolvedOrderId ?? "",
                stripeId: pi.id,
                amountCents: typeof pi.amount === "number" ? pi.amount : 0,
                currency: pi.currency ?? "usd",
                status: "succeeded"
              }
            });
          }
          break;
        }
        case "payment_intent.payment_failed": {
          const pi = event.data.object;
          const orderId = pi.metadata?.orderId;
          if (orderId) {
            await prisma.order.update({ where: { id: orderId }, data: { status: "failed" } });
            emitOrderUpdate({ id: orderId, status: "failed" });
          }
          break;
        }
        default:
          console.log("Unhandled event type", event.type);
      }
    } catch (err) {
      console.error("Error handling webhook event", err);
    }
  })();

  res.json({ received: true });
});

export default router;
