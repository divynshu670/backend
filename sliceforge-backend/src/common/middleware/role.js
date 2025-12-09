export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ msg: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ msg: "Forbidden: admin only" });
  next();
};
