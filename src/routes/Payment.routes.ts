import express from "express";

import {
  createPayment,
  verifyPayment,
  getPaymentSummary,
} from "../app/Controllers/Payment.controller";

import {
  createPaymentValidations,
  verifyPaymentValidations,
} from "../app/Middleware/Validations.middleware";

import { protect } from "../app/Middleware/Auth.middleware";

import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";

const router = express.Router();


// =========================
// CREATE PAYMENT
// =========================

router.post(
  "/",
  protect,
  createPaymentValidations,
  ErrorsCheck,
  createPayment
);


// =========================
// VERIFY PAYMENT
// =========================

router.post(
  "/verify",
  protect,
  verifyPaymentValidations,
  ErrorsCheck,
  verifyPayment
);


// =========================
// GET PAYMENT SUMMARY
// =========================

router.post(
  "/summary",
  protect,
  getPaymentSummary
);


export default router;