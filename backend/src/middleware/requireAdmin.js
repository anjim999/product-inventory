// backend/src/middleware/requireAdmin.js

module.exports = function requireAdmin(req, res, next) {
  // auth middleware should set req.user
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user found" });
  }

  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }

  next();
};
