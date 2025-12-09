import prisma from "../../db/prisma.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-08-27.basil" });

export async function createOrderFromCart(userId) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { pizza: true }
  });

  if (!cartItems.length) throw new Error("Cart is empty");

  let totalCents = 0;
  const itemsData = cartItems.map(ci => {
    const unit = ci.pizza.priceCents;
    totalCents += unit * ci.quantity;
    return { pizzaId: ci.pizzaId, quantity: ci.quantity, unitPrice: unit };
  });

  // transaction: create order + items, delete cart
  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId,
        totalCents,
        currency: process.env.STRIPE_CURRENCY || "usd",
        status: "created",
        items: { create: itemsData }
      },
      include: { items: true }
    });

    await tx.cartItem.deleteMany({ where: { userId } });
    return o;
  });

  // create Stripe PaymentIntent with idempotency
  const pi = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: order.currency,
      metadata: { orderId: order.id, userId }
    },
    { idempotencyKey: `pi_${order.id}` }
  );

  await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntent: pi.id } });

  return { order, clientSecret: pi.client_secret };
}
