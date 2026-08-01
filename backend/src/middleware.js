import { verifyToken } from "./utils.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if token exists
  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization token missing"
    });
  }

  // Extract token
  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify token
    const decoded = verifyToken(token);
    // Attach user information to request
    req.userId = decoded.userId;
    // Continue to controller
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};