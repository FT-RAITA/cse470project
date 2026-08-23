import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  try {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
      return res.status(503).json({
        message: "Authentication service is not configured. Set JWT_SECRET in backend/.env.",
      });
    }

    const decoded = jwt.verify(token, secret);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "Invalid token: user no longer exists.",
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
