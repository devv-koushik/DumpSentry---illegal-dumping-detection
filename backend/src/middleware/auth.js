import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";

/**
 * Middleware: Require a valid JWT in the Authorization header.
 * Attaches `req.user` (the admin document) on success.
 */
export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, env.jwtSecret);

    const user = await User.findById(payload.id).lean();
    if (!user || user.role !== "admin") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present,
 * but does NOT reject the request if missing.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.id).lean();
      if (user) req.user = user;
    }
  } catch {
    // Silently ignore — user stays unauthenticated
  }
  next();
}

/**
 * Generate a JWT for the given user document.
 */
export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
