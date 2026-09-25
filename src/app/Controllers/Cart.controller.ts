import { Request, Response } from "express";

import mongoose from "mongoose";

import Cart from "../Model/Cart.model";
import Product from "../Model/Product.model";

// =========================
// ADD TO CART
// =========================

export const addToCart = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;

  const userId = (req as Request & {
    user?: { id: string };
  }).user?.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(
      String(userId)
    );

    const productObjectId = new mongoose.Types.ObjectId(
      String(productId)
    );

    const existingCartItem = await Cart.findOne({
      user: userObjectId,
      product: productObjectId,
    });

    // Product already exists in cart
    if (existingCartItem) {
      existingCartItem.quantity += quantity;

      await existingCartItem.save();

      return res.status(200).json({
        success: true,
        message: "Cart quantity updated",
        cartItem: existingCartItem,
      });
    }

    // Product does not exist in cart
    const cartItem = await Cart.create({
      user: userObjectId,
      product: productObjectId,
      quantity,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to cart",
      cartItem,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// =========================
// GET MY CART
// =========================

export const getMyCart = async (
  req: Request,
  res: Response
) => {
  const userId = (req as Request & {
    user?: { id: string };
  }).user?.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(
      String(userId)
    );

    const cart = await Cart.find({
      user: userObjectId,
    }).populate("product");

    return res.status(200).json({
      success: true,
      count: cart.length,
      cart,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// UPDATE CART QUANTITY
// =========================

// =========================
// UPDATE CART QUANTITY
// =========================

export const updateCartQuantity = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const userId = (req as Request & {
    user?: { id: string };
  }).user?.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(
      String(userId)
    );

    const productObjectId = new mongoose.Types.ObjectId(
      String(productId)
    );

    const cartItem = await Cart.findOneAndUpdate(
      {
        user: userObjectId,
        product: productObjectId,
      },
      {
        quantity,
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cartItem,
    });
  } catch (error) {
    console.error(
      "Update Cart Quantity Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// REMOVE FROM CART
// =========================

export const removeFromCart = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.params;

  const userId = (req as Request & {
    user?: { id: string };
  }).user?.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(
      String(userId)
    );

    const productObjectId = new mongoose.Types.ObjectId(
      String(productId)
    );

    await Cart.findOneAndDelete({
      user: userObjectId,
      product: productObjectId,
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error(
      "Remove From Cart Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// CLEAR CART
// =========================

export const clearCart = async (
  req: Request,
  res: Response
) => {
  const userId = (req as Request & {
    user?: { id: string };
  }).user?.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(
      String(userId)
    );

    await Cart.deleteMany({
      user: userObjectId,
    });

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};