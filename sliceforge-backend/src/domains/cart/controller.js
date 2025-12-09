import prisma from "../../db/prisma.js";

export const getCart = async (req, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { pizza: true }
  });
  return res.json(items);
};

export const addOrUpdate = async (req, res) => {
  const { pizzaId, quantity } = req.body;
  if (!pizzaId || !Number.isInteger(quantity)) return res.status(400).json({ msg: "Missing fields" });

  // Upsert: create if not exists, otherwise set quantity
  try {
    const existing = await prisma.cartItem.findUnique({ where: { userId_pizzaId: { userId: req.user.id, pizzaId } } });
    if (existing) {
      const updated = await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
      return res.json(updated);
    } else {
      const created = await prisma.cartItem.create({ data: { userId: req.user.id, pizzaId, quantity } });
      return res.status(201).json(created);
    }
  } catch (err) {
    console.error("Cart update error", err);
    return res.status(500).json({ msg: "Cart update failed" });
  }
};

export const updateQuantity = async (req, res) => {
  const id = req.params.id;
  const { quantity } = req.body;
  if (!Number.isInteger(quantity)) return res.status(400).json({ msg: "Missing fields" });

  try {
    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.user.id) return res.status(404).json({ msg: "Not found" });
    const updated = await prisma.cartItem.update({ where: { id }, data: { quantity } });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ msg: "Update failed" });
  }
};

export const remove = async (req, res) => {
  const id = req.params.id;
  try {
    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.user.id) return res.status(404).json({ msg: "Not found" });
    await prisma.cartItem.delete({ where: { id } });
    return res.json({ msg: "Deleted" });
  } catch (err) {
    return res.status(500).json({ msg: "Delete failed" });
  }
};
