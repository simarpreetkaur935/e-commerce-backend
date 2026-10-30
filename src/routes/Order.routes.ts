import express from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../app/Controllers/Order.controller";

import {
  createOrderValidations,
  getOrderByIdValidations,
  cancelOrderValidations,
} from "../app/Middleware/Validations.middleware";

import { protect } from "../app/Middleware/Auth.middleware";

import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";

const router = express.Router();

// =========================
// CREATE ORDER
// =========================

router.post(
  "/",
  protect,
  createOrderValidations,
  ErrorsCheck,
  createOrder
);

// =========================
// GET MY ORDERS
// =========================

router.get(
  "/",
  protect,
  getMyOrders
);

// =========================
// GET ORDER BY ID
// =========================

router.get(
 "/:orderId",
  protect,
  getOrderByIdValidations,
  ErrorsCheck,
  getOrderById
);

// =========================
// CANCEL ORDER
// =========================

router.patch(
  "/:orderId/cancel",
  protect,
  cancelOrderValidations,
  ErrorsCheck,
  cancelOrder
);

export default router;