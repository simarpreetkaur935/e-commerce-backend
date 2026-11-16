import express from "express";

import {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} from "../app/Controllers/Review.controller";

import { protect } from "../app/Middleware/Auth.middleware";
import {
  createReviewValidation,
  getProductReviewsValidation,
  updateReviewValidations,
  reviewIdValidations,
} from "../app/Middleware/Validations.middleware";
import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";

const router = express.Router();

// CREATE REVIEW
router.post(
  "/",
  protect,
  createReviewValidation,
  ErrorsCheck,
  createReview
);

// GET MY REVIEWS
router.get("/my", protect, getMyReviews);

// GET REVIEWS FOR A PRODUCT
router.get(
  "/product/:productId",
  getProductReviewsValidation,
  ErrorsCheck,
  getProductReviews
);

// UPDATE REVIEW
router.put(
  "/:reviewId",
  protect,
  updateReviewValidations,
  ErrorsCheck,
  updateReview
);

// DELETE REVIEW
router.delete(
  "/:reviewId",
  protect,
  reviewIdValidations,
  ErrorsCheck,
  deleteReview
);

export default router;
