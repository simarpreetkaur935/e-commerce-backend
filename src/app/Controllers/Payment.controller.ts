
import { Request, Response } from "express";
import mongoose from "mongoose";

import Order from "../Model/Order.model";
import Payment from "../Model/Payment.model";
import Cart from "../Model/Cart.model";

import calculateOrderPrice from "../../utils/calculateOrderPrice";

import {
  createPaymentSession,
  getPaymentSession,
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

    // GET LOGGED-IN USER

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

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
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

    // GET ACTUAL ORDER AMOUNT

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

    // =================================================
    // STRIPE ONLINE PAYMENT
    // =================================================

    const stripeSession = await createPaymentSession(
      amount,
      order._id.toString()
    );

    if (!stripeSession.url) {
      throw new Error("Stripe checkout URL was not generated");
    }

    // SAVE PAYMENT

    const payment = await Payment.create({
      order: order._id,
      user: userId,
      amount,
      paymentMethod: "stripe",
      paymentStatus: "pending",
      stripeSessionId: stripeSession.id,
    });

    // UPDATE ORDER
    // Order model uses credit_card for Stripe payments.

    order.paymentMethod = "credit_card";
    order.paymentStatus = "pending";

    await order.save();

    // SEND STRIPE SESSION

    return res.status(201).json({
      success: true,
      message: "Stripe checkout session created successfully",
      payment,
      stripeSession: {
        id: stripeSession.id,
        url: stripeSession.url,
      },
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
    const { stripeSessionId } = req.body as {
      stripeSessionId: string;
    };

    // GET LOGGED-IN USER

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // VALIDATE SESSION ID

    if (!stripeSessionId) {
      return res.status(400).json({
        success: false,
        message: "Stripe session ID is required",
      });
    }

    // FIND PAYMENT

    const payment = await Payment.findOne({
      stripeSessionId,
      user: userId,
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

    // GET STRIPE SESSION

    const stripeSession = await getPaymentSession(
      stripeSessionId
    );

    // VERIFY PAYMENT STATUS

    if (stripeSession.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been completed",
        paymentStatus: stripeSession.payment_status,
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

    // SAVE STRIPE PAYMENT INTENT

    if (
      stripeSession.payment_intent &&
      typeof stripeSession.payment_intent === "string"
    ) {
      payment.stripePaymentIntentId =
        stripeSession.payment_intent;
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
    // GET LOGGED-IN USER

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

    // SEND RESPONSE

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
