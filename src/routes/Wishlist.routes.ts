import express from "express";

import {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
} from "../app/Controllers/Wishlist.controller";

import {
  addWishlistValidation,
  removeWishlistValidation,
  getMyWishlistValidations,
} from "../app/Middleware/Validations.middleware";

import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";
import { protect } from "../app/Middleware/Auth.middleware";

const router = express.Router();

// GET MY WISHLIST
router.get(
  "/",
  protect,
  getMyWishlistValidations,
  ErrorsCheck,
  getMyWishlist
);

// ADD TO WISHLIST
router.post(
  "/:productId",
  protect,
  addWishlistValidation,
  ErrorsCheck,
  addToWishlist
);

// REMOVE FROM WISHLIST
router.delete(
  "/:productId",
  protect,
  removeWishlistValidation,
  ErrorsCheck,
  removeFromWishlist
);

export default router;