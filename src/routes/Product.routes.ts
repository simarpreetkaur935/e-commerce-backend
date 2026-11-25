import express from "express";

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getRelatedProducts
} from "../app/Controllers/Product.controller";
import { protect } from "../app/Middleware/Auth.middleware";

const router = express.Router();

// Create product
router.post("/", protect, createProduct);

// Get all products
router.get("/", getAllProducts);

// Get product by ID
router.get("/:id", getProductById);
//get related products
router.get("/:id/related", getRelatedProducts);
// Update product
router.put("/:id", updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

export default router;
