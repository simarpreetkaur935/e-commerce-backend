import {
  Request,
  Response,
} from "express";

import crypto from "crypto";

import Order from "../Model/Order.model";
import Payment from "../Model/Payment.model";

import {
  createPaymentSession ,
} from "../../services/payment/payment.service";


// =========================
// CREATE PAYMENT
// =========================

export const createPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      orderId,
      paymentMethod,
    } = req.body;

    // =========================
    // GET LOGGED-IN USER
    // =========================

    const userId = (
      req as Request & {
        user?: {
          id: string;
        };
      }
    ).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // =========================
    // FIND ORDER
    // =========================

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =========================
    // CHECK IF ALREADY PAID
    // =========================

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    // =========================
    // GET ACTUAL ORDER AMOUNT
    // =========================

    const amount = order.totalAmount;

    // =========================
    // CASH ON DELIVERY
    // =========================

    if (paymentMethod === "cod") {
      const payment = await Payment.create({
        order: order._id,
        user: userId,
        amount,
        paymentMethod: "cod",
        paymentStatus: "pending",
      });

      order.paymentMethod = "cod";
      order.paymentStatus = "pending";
      order.orderStatus = "confirmed";

      await order.save();

      return res.status(201).json({
        success: true,
        message: "Cash on Delivery selected",
        payment,
      });
    }

    // =========================
    // ONLINE PAYMENT
    // =========================

    const razorpayOrder =
      await createPaymentSession(
        amount,
        `order_${order._id}`
      );

    // =========================
    // SAVE PAYMENT
    // =========================

    const payment = await Payment.create({
      order: order._id,
      user: userId,
      amount,
      paymentMethod,
      paymentStatus: "pending",
      razorpayOrderId:
        razorpayOrder.id,
    });

    // =========================
    // UPDATE ORDER
    // =========================

    order.paymentMethod = paymentMethod;
    order.paymentStatus = "pending";

    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      payment,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    console.error(
      "Create Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create payment",
    });
  }
};


// =========================
// VERIFY PAYMENT
// =========================

export const verifyPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // =========================
    // GET LOGGED-IN USER
    // =========================

    const userId = (
      req as Request & {
        user?: {
          id: string;
        };
      }
    ).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // =========================
    // FIND PAYMENT
    // =========================

    const payment = await Payment.findOne({
      razorpayOrderId,
      user: userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // =========================
    // GET RAZORPAY SECRET
    // =========================

    const secret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay secret is not configured",
      });
    }

    // =========================
    // CREATE SIGNATURE
    // =========================

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    // =========================
    // VERIFY SIGNATURE
    // =========================

    if (
      generatedSignature !==
      razorpaySignature
    ) {
      payment.paymentStatus = "failed";

      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // =========================
    // PAYMENT SUCCESS
    // =========================

    payment.paymentStatus = "paid";

    payment.razorpayPaymentId =
      razorpayPaymentId;

    payment.razorpaySignature =
      razorpaySignature;

    await payment.save();

    // =========================
    // FIND ORDER
    // =========================

    const order = await Order.findOne({
      _id: payment.order,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =========================
    // UPDATE ORDER
    // =========================

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
      order,
    });
  } catch (error) {
    console.error(
      "Verify Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
};