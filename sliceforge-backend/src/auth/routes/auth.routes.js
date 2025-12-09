// src/auth/routes/auth.routes.js
import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../db/prisma.js";
import { blacklistToken } from "../../common/middleware/auth.js";

const router = express.Router();

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

router.post(
  "/signup",
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ msg: "User already exists" });

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, hashedPassword: hashed }
      });

      const token = createToken(user.id);
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    // Admin bootstrap
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      let admin = await prisma.user.findUnique({ where: { email } });
      if (!admin) {
        admin = await prisma.user.create({
          data: {
            name: "Admin",
            email,
            hashedPassword: await bcrypt.hash(password, 10),
            role: "admin"
          }
        });
      } else if (admin.role !== "admin") {
        admin = await prisma.user.update({ where: { email }, data: { role: "admin" } });
      }
      const token = createToken(admin.id);
      return res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.hashedPassword) return res.status(401).json({ msg: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.hashedPassword);
      if (!ok) return res.status(401).json({ msg: "Invalid credentials" });

      const token = createToken(user.id);
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ msg: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  blacklistToken(token);
  return res.json({ msg: "Logged out" });
});

export default router;
