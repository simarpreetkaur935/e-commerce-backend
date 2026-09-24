import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Get only the token
    const token = authHeader.split(" ")[1];

    const jwtSecret =
      process.env.NODE_APP_JWT_SECRET_KEY;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message:
          "JWT secret is not configured",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as {
      id: string;
      name: string;
      email: string;
    };

    // Store user ID in request
    (req as Request & {
      user?: {
        id: string;
      };
    }).user = {
      id: decoded.id,
    };

    // Move to controller
    next();
  } catch (error) {
    console.error(
      "Auth Middleware Error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired access token",
    });
  }
};