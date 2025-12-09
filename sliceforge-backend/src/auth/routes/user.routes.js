import express from "express";
import { authMiddleware } from "../../common/middleware/auth.js";
import prisma from "../../db/prisma.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  const user = req.user;
  return res.json({ id: user.id, name: user.name, email: user.email, address: user.address, role: user.role });
});

router.put("/me", authMiddleware, async (req, res) => {
  const { name, address } = req.body;
  try {
    const updated = await prisma.user.update({ where: { id: req.user.id }, data: { name: name ?? req.user.name, address: address ?? req.user.address } });
    return res.json({ user: updated });
  } catch (err) {
    return res.status(500).json({ msg: "Update failed" });
  }
});

router.put("/me/password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ msg: "Missing fields" });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.hashedPassword) return res.status(400).json({ msg: "Password change not supported for this account" });

    const ok = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!ok) return res.status(401).json({ msg: "Invalid current password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { hashedPassword: hashed } });
    return res.json({ msg: "Password updated" });
  } catch (err) {
    return res.status(500).json({ msg: "Update failed" });
  }
});

export default router;
