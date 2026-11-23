import { Request, Response, NextFunction } from "express";
import UserRole from "../Model/UserRole.model";
import PermissionRole from "../Model/PermissionRole.model";
import Permission from "../Model/Permission.model";

export const permissionMiddleware = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const userRoles = await UserRole.find({ user_id: userId }).select("role_id");
      const roleIds = userRoles.map(({ role_id }) => role_id);
      const rolePermissions = await PermissionRole.find({
        role_id: { $in: roleIds },
      }).select("permission_id");
      const permissionIds = rolePermissions.map(({ permission_id }) => permission_id);
      const hasPermission = await Permission.exists({
        _id: { $in: permissionIds },
        resource,
        action,
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      return next();
    } catch (error) {
      console.error("Permission Middleware Error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
};
