import express from "express";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireAdmin } from "../../common/middleware/role.js";
import prisma from "../../db/prisma.js";
import { emitOrderUpdate } from "../../socket/socket.js";

const router = express.Router();
router.use(authMiddleware, requireAdmin);

// a simple allowed transitions map
const allowed = {
  created: ["paid", "cancelled"],
  paid: ["confirmed", "cancelled"],
  confirmed: ["preparing"],
  preparing: ["ready_for_pickup", "out_for_delivery"],
  ready_for_pickup: ["delivered"],
  out_for_delivery: ["delivered"]
};

router.put("/:id/status", async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const allowedNext = allowed[order.status] || [];
    if (!allowedNext.includes(status)) return res.status(400).json({ msg: `Invalid transition from ${order.status} to ${status}` });

    const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });
    emitOrderUpdate(updated);
    return res.json(updated);
  } catch (err) {
    console.error("Status update error", err);
    return res.status(500).json({ msg: "Update failed" });
  }
});

export default router;
