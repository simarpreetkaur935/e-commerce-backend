import express from "express";

import {
  addToCart,
  getMyCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from "../app/Controllers/Cart.controller";

import { protect } from "../app/Middleware/Auth.middleware";

import {
  addToCartValidation,
  getMyCartValidation,
  updateCartValidation,
  removeFromCartValidation,
  clearCartValidation,
} from "../app/Middleware/Validations.middleware";

import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";

const router = express.Router();

// =========================
// GET MY CART
// =========================

router.get(
  "/",
  protect,
  getMyCartValidation,
  ErrorsCheck,
  getMyCart
);

// =========================
// ADD TO CART
// =========================

router.post(
  "/:productId",
  protect,
  addToCartValidation,
  ErrorsCheck,
  addToCart
);

// =========================
// UPDATE CART QUANTITY
// =========================

router.patch(
  "/:productId",
  protect,
  updateCartValidation,
  ErrorsCheck,
  updateCartQuantity
);

// =========================
// REMOVE FROM CART
// =========================

router.delete(
  "/:productId",
  protect,
  removeFromCartValidation,
  ErrorsCheck,
  removeFromCart
);

// =========================
// CLEAR CART
// =========================

router.delete(
  "/",
  protect,
  clearCartValidation,
  ErrorsCheck,
  clearCart
);

export default router;