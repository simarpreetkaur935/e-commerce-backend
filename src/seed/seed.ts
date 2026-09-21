import mongoose from "mongoose";
import dotenv from "dotenv";

import Category from "../app/Model/Category.model";
import Product from "../app/Model/Product.model";

import { categorySeed } from "./categorySeed";
import { generateProducts } from "./productSeed";

dotenv.config();

const seedDatabase = async () => {
  try {
    // =========================
    // CONNECT TO DATABASE
    // =========================

    await mongoose.connect(process.env.NODE_APP_MONGO_DB_URL!);

    console.log("MongoDB connected");

    // =========================
    // CLEAR EXISTING DATA
    // =========================

    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log("Old products and categories deleted");

    // =========================
    // CREATE PARENT CATEGORIES
    // =========================

    const parentCategories = categorySeed.filter(
      (category) => !category.parent
    );

    const subCategories = categorySeed.filter(
      (category) => category.parent
    );

    const createdParents = await Category.insertMany(
      parentCategories.map((category) => ({
        name: category.name,
        description: category.description,
        image: category.image,
        parentCategory: null,
        isActive: true,
      }))
    );

    console.log(
      `${createdParents.length} parent categories created`
    );

    // =========================
    // MAP PARENT NAME → MONGODB ID
    // =========================

    const parentMap = new Map<string, mongoose.Types.ObjectId>();

    createdParents.forEach((category) => {
      parentMap.set(category.name, category._id);
    });

    // =========================
    // CREATE SUBCATEGORIES
    // =========================

    const createdSubCategories = await Category.insertMany(
      subCategories.map((category) => ({
        name: category.name,
        description: category.description,
        image: category.image,
        parentCategory: parentMap.get(category.parent!),
        isActive: true,
      }))
    );

    console.log(
      `${createdSubCategories.length} subcategories created`
    );

    // =========================
    // GET ALL CATEGORIES
    // =========================

    const allCategories = [
      ...createdParents,
      ...createdSubCategories,
    ].map((category) => ({
      _id: category._id,
      name: category.name,
    }));

    // =========================
    // CREATE 10,000 PRODUCTS
    // =========================

    const products = generateProducts(
      allCategories,
      10000
    );

    // =========================
    // INSERT PRODUCTS IN BATCHES
    // =========================

    const batchSize = 1000;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      await Product.insertMany(batch);

      console.log(
        `Inserted ${Math.min(
          i + batchSize,
          products.length
        )} / ${products.length} products`
      );
    }

    // =========================
    // SUCCESS
    // =========================

    console.log("=================================");
    console.log("Database seeded successfully");
    console.log(`Categories: ${allCategories.length}`);
    console.log(`Products: ${products.length}`);
    console.log("=================================");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedDatabase();