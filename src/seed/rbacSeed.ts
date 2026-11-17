import mongoose from "mongoose";
import dotenv from "dotenv";

import Permission from "../app/Model/Permission.model";
import PermissionRole from "../app/Model/PermissionRole.model";
import Role from "../app/Model/Role.model";

import { permissionSeed } from "./permissionSeed";
import { roleSeed } from "./roleSeed";

dotenv.config();

const rolePermissions: Record<string, string[]> = {
  admin: permissionSeed.map((permission) => permission.name),
  seller: [
    "products.create",
    "products.read",
    "products.update",
    "categories.read",
    "orders.read",
  ],
  customer: [
    "products.read",
    "categories.read",
    "orders.create",
    "orders.read",
    "orders.cancel",
    "reviews.create",
    "reviews.read",
    "reviews.update",
  ],
  user: ["products.read", "categories.read", "reviews.read"],
  order_manager: [
    "products.read",
    "categories.read",
    "orders.read",
    "orders.update",
    "orders.cancel",
  ],
  product_manager: [
    "products.create",
    "products.read",
    "products.update",
    "products.delete",
    "categories.create",
    "categories.read",
    "categories.update",
    "categories.delete",
  ],
};

const seedRbac = async () => {
  try {
    await mongoose.connect(process.env.NODE_APP_MONGO_DB_URL!);

    await Role.bulkWrite(
      roleSeed.map((role) => ({
        updateOne: {
          filter: { name: role.name },
          update: { $set: role },
          upsert: true,
        },
      }))
    );

    await Permission.bulkWrite(
      permissionSeed.map((permission) => ({
        updateOne: {
          filter: { name: permission.name },
          update: { $set: permission },
          upsert: true,
        },
      }))
    );

    const roles = await Role.find({ name: { $in: roleSeed.map(({ name }) => name) } });
    const permissions = await Permission.find({
      name: { $in: permissionSeed.map(({ name }) => name) },
    });

    const roleIdByName = new Map(
      roles.map((role) => [role.name, role._id])
    );
    const permissionIdByName = new Map(
      permissions.map((permission) => [permission.name, permission._id])
    );

    const mappings = Object.entries(rolePermissions).flatMap(
      ([roleName, permissionNames]) => {
        const roleId = roleIdByName.get(roleName);
        if (!roleId) {
          throw new Error(`Role not found after upsert: ${roleName}`);
        }

        return permissionNames.map((permissionName) => {
          const permissionId = permissionIdByName.get(permissionName);
          if (!permissionId) {
            throw new Error(
              `Permission not found after upsert: ${permissionName}`
            );
          }

          return { role_id: roleId, permission_id: permissionId };
        });
      }
    );

    if (mappings.length > 0) {
      await PermissionRole.bulkWrite(
        mappings.map(({ role_id, permission_id }) => ({
          updateOne: {
            filter: { role_id, permission_id },
            update: { $setOnInsert: { role_id, permission_id } },
            upsert: true,
          },
        }))
      );
    }

    console.log(
      `RBAC seeded: ${roleSeed.length} roles, ${permissionSeed.length} permissions, ${mappings.length} mappings`
    );
  } catch (error) {
    console.error("RBAC seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedRbac();
