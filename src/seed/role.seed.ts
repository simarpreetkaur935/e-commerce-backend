import mongoose from "mongoose";
import dotenv from "dotenv";

import Role from "../app/Model/Role.model";

dotenv.config();

const roles = [
  {
    name: "admin",
    description: "Manages the platform and its users, products, and orders.",
  },
  {
    name: "seller",
    description: "Lists and manages products for sale.",
  },
  {
    name: "customer",
    description: "Browses products and places orders.",
  },
  {
    name: "user",
    description: "Uses the basic features of the platform.",
  },
  {
    name: "order_manager",
    description: "Manages customer orders and their fulfillment.",
  },
  {
    name: "product_manager",
    description: "Manages product listings and catalog details.",
  },
];

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.NODE_APP_MONGO_DB_URL!);

    await Role.bulkWrite(
      roles.map((role) => ({
        updateOne: {
          filter: { name: role.name },
          update: { $set: { description: role.description } },
          upsert: true,
        },
      }))
    );

    console.log(`${roles.length} roles seeded successfully`);
  } catch (error) {
    console.error("Role seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedRoles();
