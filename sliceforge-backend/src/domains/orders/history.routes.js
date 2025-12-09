import express from "express";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireAdmin } from "../../common/middleware/role.js";
import prisma from "../../db/prisma.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  // user order history
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json(orders);
});

router.get("/admin", authMiddleware, requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({ include: { items: true, user: true }, orderBy: { createdAt: "desc" } });
  return res.json(orders);
});

export default router;
