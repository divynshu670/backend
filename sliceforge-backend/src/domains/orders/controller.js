import * as service from "./service.js";
import { emitOrderUpdate } from "../../socket/socket.js";

export const create = async (req, res) => {
  try {
    const { order, clientSecret } = await service.createOrderFromCart(req.user.id);
    emitOrderUpdate(order);
    return res.json({ orderId: order.id, clientSecret });
  } catch (err) {
    console.error("Order create error:", err);
    return res.status(400).json({ msg: err.message || "Order creation failed" });
  }
};
