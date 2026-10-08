import {Request, Response,} from "express";

import Order from "../Model/Order.model";
import Payment from "../Model/Payment.model";

import {
  createPaymentSession,
  getPaymentSession,
} from "../../services/payment/payment.service";


// =========================
// CREATE PAYMENT
// =========================

export const createPayment = async (req: Request,res: Response) => {
  try {
    const {orderId,paymentMethod,} = req.body;

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
    // STRIPE ONLINE PAYMENT
    // =========================

    const stripeSession =
      await createPaymentSession(
        amount,
        order._id.toString()
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
      stripeSessionId: stripeSession.id,
    });

    // =========================
    // UPDATE ORDER
    // =========================

    order.paymentMethod = paymentMethod;
    order.paymentStatus = "pending";

    await order.save();

    // =========================
    // SEND STRIPE SESSION
    // =========================

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

export const verifyPayment = async (req: Request,res: Response) => {
  try {
    const {
      stripeSessionId,
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
      stripeSessionId,
      user: userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // =========================
    // GET STRIPE SESSION
    // =========================

    const stripeSession =
      await getPaymentSession(
        stripeSessionId
      );

    // =========================
    // CHECK PAYMENT STATUS
    // =========================

    if (
      stripeSession.payment_status !==
      "paid"
    ) {
      payment.paymentStatus = "failed";

      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment has not been completed",
        paymentStatus:
          stripeSession.payment_status,
      });
    }

    // =========================
    // SAVE STRIPE PAYMENT INTENT
    // =========================

    if (
      stripeSession.payment_intent &&
      typeof stripeSession.payment_intent === "string"
    ) {
      payment.stripePaymentIntentId =
        stripeSession.payment_intent;
    }

    payment.paymentStatus = "paid";

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

    // =========================
    // SUCCESS RESPONSE
    // =========================

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