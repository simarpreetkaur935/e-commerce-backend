
import { Request, Response } from "express";
import mongoose from "mongoose";

import Order from "../Model/Order.model";
import Payment from "../Model/Payment.model";
import Cart from "../Model/Cart.model";

import calculateOrderPrice from "../../utils/calculateOrderPrice";

import {
  createPaymentIntent,
  getPaymentIntent,
} from "../../services/payment/payment.service";

// =================================================
// TYPES
// =================================================

interface PopulatedProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  discountPrice?: number;
  tax?: number;
  images?: string[];
}

type PaymentMethod = "stripe" | "cod";

// =================================================
// GET LOGGED-IN USER
// =================================================

const getUserId = (req: Request): string | undefined => {
  return (
    req as Request & {
      user?: {
        id: string;
      };
    }
  ).user?.id;
};

// =================================================
// CREATE PAYMENT
// =================================================

export const createPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderId, paymentMethod } = req.body as {
      orderId: string;
      paymentMethod: PaymentMethod;
    };

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // VALIDATE PAYMENT METHOD

    if (!["stripe", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // VALIDATE ORDER ID

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // FIND ORDER

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

    // CHECK IF ALREADY PAID

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    // CHECK IF ORDER IS CANCELLED

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot pay for a cancelled order",
      });
    }

    // CHECK PAYMENT METHOD MATCHES ORDER

    if (
      (paymentMethod === "cod" && order.paymentMethod !== "cod") ||
      (paymentMethod === "stripe" && order.paymentMethod === "cod")
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment method does not match the order",
      });
    }

    // GET ORDER AMOUNT

    const amount = order.totalAmount;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    // =================================================
    // CASH ON DELIVERY
    // =================================================

    if (paymentMethod === "cod") {

      // CHECK EXISTING COD PAYMENT

      let payment = await Payment.findOne({
        order: order._id,
        user: userId,
        paymentMethod: "cod",
      });

      // CREATE PAYMENT ONLY IF IT DOES NOT EXIST

      if (!payment) {
        payment = await Payment.create({
          order: order._id,
          user: userId,
          amount,
          paymentMethod: "cod",
          paymentStatus: "pending",
        });
      }

      order.paymentMethod = "cod";
      order.paymentStatus = "pending";
      order.orderStatus = "confirmed";

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Cash on Delivery selected",
        payment,
      });
    }

    // =================================================
    // STRIPE PAYMENT INTENT
    // =================================================

    // CHECK EXISTING PENDING STRIPE PAYMENT

    let existingPayment = await Payment.findOne({
      order: order._id,
      user: userId,
      paymentMethod: "stripe",
      paymentStatus: "pending",
    });

    // REUSE EXISTING PAYMENT INTENT IF IT IS STILL USABLE

    if (existingPayment?.stripePaymentIntentId) {
      const existingIntent = await getPaymentIntent(
        existingPayment.stripePaymentIntentId
      );

      const reusableStatuses = [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
        "processing",
        "succeeded",
      ];

      if (reusableStatuses.includes(existingIntent.status)) {

        if (!existingIntent.client_secret) {
          throw new Error("Stripe client secret is unavailable");
        }

        return res.status(200).json({
          success: true,
          message: "Existing PaymentIntent retrieved",
          payment: existingPayment,
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
        });
      }
    }

    // CREATE NEW PAYMENT INTENT

    const stripePayment = await createPaymentIntent(
      amount,
      order._id.toString()
    );

    if (!stripePayment.clientSecret) {
      throw new Error("Stripe client secret was not generated");
    }

    // UPDATE EXISTING PAYMENT OR CREATE A NEW ONE

    let payment;

    if (existingPayment) {
      existingPayment.amount = amount;
      existingPayment.stripePaymentIntentId =
        stripePayment.paymentIntentId;

      payment = await existingPayment.save();
    } else {
      payment = await Payment.create({
        order: order._id,
        user: userId,
        amount,
        paymentMethod: "stripe",
        paymentStatus: "pending",
        stripePaymentIntentId: stripePayment.paymentIntentId,
      });
    }

    // UPDATE ORDER

    // Order model uses credit_card for Stripe payments.

    order.paymentMethod = "credit_card";
    order.paymentStatus = "pending";

    await order.save();

    // SEND CLIENT SECRET TO FRONTEND

    return res.status(201).json({
      success: true,
      message: "PaymentIntent created successfully",
      payment,
      clientSecret: stripePayment.clientSecret,
      paymentIntentId: stripePayment.paymentIntentId,
    });

  } catch (error) {
    console.error("Create Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment",
    });
  }
};

// =================================================
// VERIFY PAYMENT
// =================================================

export const verifyPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const { paymentIntentId } = req.body as {
      paymentIntentId: string;
    };

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // VALIDATE PAYMENT INTENT ID

    if (
      !paymentIntentId ||
      typeof paymentIntentId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "PaymentIntent ID is required",
      });
    }

    // FIND PAYMENT

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      user: userId,
      paymentMethod: "stripe",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // CHECK IF ALREADY PAID

    if (payment.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
      });
    }

    // RETRIEVE PAYMENT INTENT FROM STRIPE

    const paymentIntent = await getPaymentIntent(
      paymentIntentId
    );

    // VERIFY ORDER REFERENCE

    if (
      paymentIntent.metadata.orderId !== payment.order.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "PaymentIntent does not belong to this order",
      });
    }

    // VERIFY AMOUNT AND CURRENCY

    if (
      paymentIntent.amount !== Math.round(payment.amount * 100) ||
      paymentIntent.currency !== "inr"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency does not match",
      });
    }

    // VERIFY PAYMENT STATUS

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been completed",
        paymentStatus: paymentIntent.status,
      });
    }

    // FIND ORDER

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

    // CHECK ORDER PAYMENT STATUS

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid",
      });
    }

    // UPDATE PAYMENT

    payment.paymentStatus = "paid";

    await payment.save();

    // UPDATE ORDER

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";

    await order.save();

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
      order,
    });

  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
};

// =================================================
// GET PAYMENT SUMMARY
// =================================================

export const getPaymentSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // GET PAYMENT METHOD

    const { paymentMethod } = req.body as {
      paymentMethod: PaymentMethod;
    };

    if (!["stripe", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // GET USER CART AND POPULATE PRODUCT

    const cartItems = await Cart.find({
      user: userId,
    }).populate<{
      product: PopulatedProduct | null;
    }>("product");

    // CHECK EMPTY CART

    if (!cartItems.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // PREPARE CART ITEMS

    const formattedCartItems = cartItems.map((item) => {
      if (!item.product) {
        throw new Error("Product not found in cart");
      }

      return {
        product: item.product,
        quantity: item.quantity,
      };
    });

    // CALCULATE PRICE

    const priceDetails = calculateOrderPrice(
      formattedCartItems,
      paymentMethod
    );

    return res.status(200).json({
      success: true,
      message: "Price calculated successfully",
      priceDetails,
    });

  } catch (error) {
    console.error("Payment Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate price details",
    });
  }
};
