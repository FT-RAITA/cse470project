import jwt from "jsonwebtoken";
import User from "../models/user.js";

const cleanBearerToken = (authorization = "") => {
  const match = String(authorization).match(/^Bearer\s+(.+)$/i);
  if (!match) return "";

  return match[1]
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .trim();
};

export const authMiddleware = async (req, res, next) => {
  const token = cleanBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    return res.status(503).json({
      message: "Authentication service is not configured. Set JWT_SECRET in backend/.env.",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  if (!decoded?.id) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  try {
    req.user = await User.findById(decoded.id).select("-password");
  } catch (error) {
    console.error("AUTH USER LOOKUP ERROR:", error.message);
    return res.status(500).json({
      message: "Could not validate the current session. Please try again.",
    });
  }

  if (!req.user) {
    return res.status(401).json({
      message: "Invalid token: user no longer exists.",
    });
  }

  return next();
};
