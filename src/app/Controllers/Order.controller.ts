
import { Request, Response } from "express";
import mongoose from "mongoose";

import Cart from "../Model/Cart.model";
import Order from "../Model/Order.model";
import Product from "../Model/Product.model";

// =========================
// HELPER: CREATE ERROR
// =========================

const createError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

// =========================
// CREATE ORDER
// =========================

export const createOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const userId = (
      req as Request & { user?: { id: string } }
    ).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required",
      });
    }

    let createdOrder: any;

    await session.withTransaction(async () => {
      // GET CART
      const cartItems = await Cart.find({ user: userId })
        .populate("product")
        .session(session);

      if (!cartItems.length) {
        throw createError("Your cart is empty", 400);
      }

      const orderItems = [];

      // CHECK STOCK AND DECREASE IT
      for (const cartItem of cartItems) {
        const product: any = cartItem.product;
        const quantity = cartItem.quantity;

        if (!product || !product.isActive) {
          throw createError(
            "A product in your cart is unavailable",
            400
          );
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw createError("Invalid product quantity", 400);
        }

        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            isActive: true,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw createError(
            `Insufficient stock for ${product.name}`,
            400
          );
        }

        const price = product.discountPrice ?? product.price;
        const total = price * quantity;

        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.images?.[0],
          quantity,
          price,
          total,
        });
      }

      // CALCULATE TOTAL
      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      const tax = 0;
      const shippingCharge = 0;
      const discount = 0;
      const totalAmount = subtotal + tax + shippingCharge - discount;

      // CREATE ORDER
      const orders = await Order.create(
        [
          {
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
            stockRestored: false,
          },
        ],
        { session }
      );

      createdOrder = orders[0];

      // CLEAR CART
      await Cart.deleteMany({ user: userId }).session(session);
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: createdOrder,
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to create order",
    });
  } finally {
    await session.endSession();
  }
};

// =========================
// GET MY ORDERS
// =========================

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (
      req as Request & { user?: { id: string } }
    ).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const orders = await Order.find({ user: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get orders",
    });
  }
};

// =========================
// GET ORDER BY ID
// =========================

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const userId = (
      req as Request & { user?: { id: string } }
    ).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
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
    console.error("Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get order",
    });
  }
};

// =========================
// CANCEL ORDER
// =========================

export const cancelOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { orderId } = req.params;

    const userId = (
      req as Request & { user?: { id: string } }
    ).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    let cancelledOrder: any;

    await session.withTransaction(async () => {
      // CANCEL AN ELIGIBLE ORDER ONLY ONCE
      cancelledOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,
          user: userId,
          orderStatus: {
            $in: ["pending", "confirmed", "processing"],
          },
          stockRestored: false,
        },
        {
          $set: {
            orderStatus: "cancelled",
            stockRestored: true,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!cancelledOrder) {
        const existingOrder = await Order.findOne({
          _id: orderId,
          user: userId,
        }).session(session);

        if (!existingOrder) {
          throw createError("Order not found", 404);
        }

        throw createError("This order cannot be cancelled", 400);
      }

      // RESTORE THE PURCHASED QUANTITY
      for (const item of cancelledOrder.items) {
        const result = await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { session }
        );

        if (result.matchedCount !== 1) {
          throw createError(
            `Product ${item.name} was not found`,
            400
          );
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled and stock restored successfully",
      order: cancelledOrder,
    });
  } catch (error: any) {
    console.error("Cancel Order Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to cancel order",
    });
  } finally {
    await session.endSession();
  }
};

// =========================
// RETURN ORDER
// =========================

export const returnOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { orderId } = req.params;

    const userId = (
      req as Request & { user?: { id: string } }
    ).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    let returnedOrder: any;

    await session.withTransaction(async () => {
      // ONLY DELIVERED ORDERS CAN BE RETURNED
      returnedOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,
          user: userId,
          orderStatus: "delivered",
          stockRestored: false,
        },
        {
          $set: {
            orderStatus: "returned",
            stockRestored: true,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!returnedOrder) {
        const existingOrder = await Order.findOne({
          _id: orderId,
          user: userId,
        }).session(session);

        if (!existingOrder) {
          throw createError("Order not found", 404);
        }

        throw createError(
          "Only delivered orders that have not already been returned can be returned",
          400
        );
      }

      // RESTORE THE PURCHASED QUANTITY
      for (const item of returnedOrder.items) {
        const result = await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { session }
        );

        if (result.matchedCount !== 1) {
          throw createError(
            `Product ${item.name} was not found`,
            400
          );
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Order returned and stock restored successfully",
      order: returnedOrder,
    });
  } catch (error: any) {
    console.error("Return Order Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to return order",
    });
  } finally {
    await session.endSession();
  }
};
