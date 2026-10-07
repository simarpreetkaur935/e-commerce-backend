import {
  Request,
  Response,
} from "express";

import Cart from "../Model/Cart.model";
import Order from "../Model/Order.model";

// =========================
// CREATE ORDER
// =========================

export const createOrder = async (
  req: Request,
  res: Response
) => {
  try {
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

    const {
      shippingAddress,
      paymentMethod,
    } = req.body;

    // =========================
    // GET CART
    // =========================

    const cartItems = await Cart.find({
      user: userId,
    }).populate("product");

    if (!cartItems.length) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // =========================
    // CREATE ORDER ITEMS
    // =========================

    const orderItems = cartItems.map(
      (cartItem: any) => {
        const product = cartItem.product;

        const price =
          product.discountPrice ?? product.price;

        const quantity =
          cartItem.quantity;

        const total =
          price * quantity;

        return {
          product: product._id,
          name: product.name,
          image: product.images?.[0],
          quantity,
          price,
          total,
        };
      }
    );

    // =========================
    // CALCULATE SUBTOTAL
    // =========================

    const subtotal = orderItems.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );

    // =========================
    // TAX
    // =========================

    const tax = 0;

    // =========================
    // SHIPPING
    // =========================

    const shippingCharge = 0;

    // =========================
    // DISCOUNT
    // =========================

    const discount = 0;

    // =========================
    // TOTAL AMOUNT
    // =========================

    const totalAmount =
      subtotal +
      tax +
      shippingCharge -
      discount;

    // =========================
    // CREATE ORDER
    // =========================

    const order = await Order.create({
      user: userId,

      items: orderItems,

      shippingAddress,

      subtotal,

      tax,

      shippingCharge,

      discount,

      totalAmount,

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: "pending",
    });

    // =========================
    // CLEAR CART
    // =========================

    await Cart.deleteMany({
      user: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create order",
    });
  }
};

// =========================
// GET MY ORDERS
// =========================

export const getMyOrders = async (
  req: Request,
  res: Response
) => {
  try {
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

    const orders = await Order.find({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get My Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to get orders",
    });
  }
};

// =========================
// GET ORDER BY ID
// =========================

export const getOrderById = async (req: Request,res: Response) => {
  try {
    const { orderId } = req.params;

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

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to get order",
    });
  }
};

// =========================
// CANCEL ORDER
// =========================

export const cancelOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderId } = req.params;

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

    if (
      order.orderStatus === "shipped" ||
      order.orderStatus === "delivered" ||
      order.orderStatus === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order cannot be cancelled",
      });
    }

    order.orderStatus = "cancelled";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Cancel Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to cancel order",
    });
  }
};