import mongoose from "mongoose";
import dotenv from "dotenv";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

import Permission from "../app/Model/Permission.model";
import PermissionRole from "../app/Model/PermissionRole.model";
import Role from "../app/Model/Role.model";
import User from "../app/Model/User.model";
import UserRole from "../app/Model/UserRole.model";

import { permissionSeed } from "./permissionSeed";
import { roleSeed } from "./roleSeed";
import { env } from "process";

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
  auditor: [
    "users.read",
    "products.read",
    "categories.read",
    "orders.read",
    "reviews.read",
  ],
  analyst: [
    "products.read",
    "categories.read",
    "orders.read",
    "reviews.read",
  ],
};

const demoUsers = [
  {
    role: "seller",
    name: "Demo Seller",
    email: "rbac-seller@example.com",
    phone: "+919999000001",
  },
  {
    role: "customer",
    name: "Demo Customer",
    email: "rbac-customer@example.com",
    phone: "+919999000002",
  },
  {
    role: "user",
    name: "Demo User",
    email: "rbac-user@example.com",
    phone: "+919999000003",
  },
  {
    role: "order_manager",
    name: "Demo Order Manager",
    email: "rbac-order-manager@example.com",
    phone: "+919999000004",
  },
  {
    role: "product_manager",
    name: "Demo Product Manager",
    email: "rbac-product-manager@example.com",
    phone: "+919999000005",
  },
  {
    role: "auditor",
    name: "Demo Auditor",
    email: "rbac-auditor@example.com",
    phone: "+919999000006",
  },
  {
    role: "analyst",
    name: "Demo Analyst",
    email: "rbac-analyst@example.com",
    phone: "+919999000007",
  },
];

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

    const adminEmail = process.env.RBAC_ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail) {
      throw new Error(
        "Set RBAC_ADMIN_EMAIL to the existing admin user's email."
      );
    }

    const adminUser = await User.findOne({ email: adminEmail }).select("_id");
    if (!adminUser) {
      throw new Error(
        `Existing admin user not found for RBAC_ADMIN_EMAIL=${adminEmail}`
      );
    }

    const adminRoleId = roleIdByName.get("admin");
    if (!adminRoleId) {
      throw new Error("Admin role not found after upsert.");
    }

    const userRoleMappings = [{ user_id: adminUser._id, role_id: adminRoleId }];

    for (const demoUser of demoUsers) {
      const roleId = roleIdByName.get(demoUser.role);
      if (!roleId) {
        throw new Error(`Role not found after upsert: ${demoUser.role}`);
      }

      const generatedPasswordHash = await bcrypt.hash(
        process.env.RBAC_DEFAULT_LOGIN_PASSWORD!,
        12
      );
      const user = await User.findOneAndUpdate(
        { email: demoUser.email },
        {
          $setOnInsert: {
            name: demoUser.name,
            email: demoUser.email,
            phone: demoUser.phone,
            password: generatedPasswordHash,
            isVerified: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).select("_id");
      if (!user) {
        throw new Error(`Could not upsert demo user for role: ${demoUser.role}`);
      }

      userRoleMappings.push({ user_id: user._id, role_id: roleId });
    }

    await UserRole.bulkWrite(
      userRoleMappings.map(({ user_id, role_id }) => ({
        updateOne: {
          filter: { user_id, role_id },
          update: { $setOnInsert: { user_id, role_id } },
          upsert: true,
        },
      }))
    );

    console.log(
      `RBAC seeded: ${roleSeed.length} roles, ${permissionSeed.length} permissions, ${mappings.length} permission mappings, ${userRoleMappings.length} user-role mappings`
    );
  } catch (error) {
    console.error("RBAC seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedRbac();
