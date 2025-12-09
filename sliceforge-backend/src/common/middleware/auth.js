// src/common/middleware/auth.js
import jwt from "jsonwebtoken";
import prisma from "../../db/prisma.js";

const tokenBlacklist = new Set();
export const blacklistToken = (token) => tokenBlacklist.add(token);

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (tokenBlacklist.has(token)) return res.status(401).json({ msg: "Token revoked" });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ msg: "Server misconfigured" });

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ msg: "Invalid token" });
    }

    if (!decoded?.id) return res.status(401).json({ msg: "Invalid token" });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ msg: "User not found" });

    // Attach a sanitized user object to prevent accidental leaks (no hashedPassword, no googleId)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address ?? null,
      role: user.role ?? "user"
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ msg: "Unauthorized" });
  }
};
