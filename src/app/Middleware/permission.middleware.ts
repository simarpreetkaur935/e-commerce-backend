import { Request, Response, NextFunction } from "express";

export const checkPermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.user?.roles ?? [];

    // Admin has all permissions
    if (roles.some((role) => role.name === "admin")) {
      return next();
    }

    // Check permission assigned to user's roles
    const hasPermission = roles.some((role) =>
      role.permissions?.some(
        (permission) =>
          permission.resource === resource &&
          permission.action === action
      )
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    next();
  };
};