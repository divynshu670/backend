// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import http from "http";

import authRoutes from "./auth/routes/auth.routes.js";
import userRoutes from "./auth/routes/user.routes.js";
import pizzaRoutes from "./domains/pizzas/routes.js";
import adminPizzaRoutes from "./domains/pizzas/admin.routes.js";
import cartRoutes from "./domains/cart/routes.js";
import ordersRoutes from "./domains/orders/routes.js";
import orderStatusRoutes from "./domains/orders/status.routes.js";
import orderHistoryRoutes from "./domains/orders/history.routes.js";
import webhookRouter from "./payment/routes/webhook.js";
import prisma from "./db/prisma.js";
import { attachSocket } from "./socket/index.js";
import { errorHandler } from "./common/middleware/errorHandler.js";

dotenv.config();
const app = express();

// security / logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));

// webhook MUST be raw; mount before express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }), webhookRouter);

// standard parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/api/pizzas", pizzaRoutes);
app.use("/api/admin/pizzas", adminPizzaRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin/orders", orderStatusRoutes);
app.use("/api/orders/history", orderHistoryRoutes);

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

// error handler (last)
app.use(errorHandler);

// create server + sockets
const server = http.createServer(app);
attachSocket(server);

const PORT = parseInt(process.env.PORT || "5000", 10);
async function start() {
  try {
    await prisma.$connect();
    console.log("Connected to DB");
  } catch (err) {
    console.error("DB connect failed:", err);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

start();

process.on("SIGINT", async () => {
  console.log("SIGINT, disconnecting DB");
  try { await prisma.$disconnect(); } catch (e) {}
  process.exit(0);
});
