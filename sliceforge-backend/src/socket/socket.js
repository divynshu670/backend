export function emitOrderUpdate(order) {
  if (!global.io) return;
  try {
    if (order.userId) global.io.to(order.userId).emit("order_updated", order);
    global.io.emit("admin_order_updated", order);
  } catch (e) {
    console.error("Socket emit failed:", e);
  }
}
