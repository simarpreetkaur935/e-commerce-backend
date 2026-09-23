import Wishlist from "../Model/wishlist.model";
import { Request, Response } from "express";
import mongoose from "mongoose";


export const addToWishlist = async (req: Request, res: Response) => {
  const { productId } = req.params;

  const userId = (req as Request & {
    user?: { id: string };
  }).user?.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(String(userId));
    const productObjectId = new mongoose.Types.ObjectId(String(productId));

    const wishlist = await Wishlist.create({
      user: userObjectId,
      product: productObjectId,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("Add Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET MY WISHLIST
// =========================

export const getMyWishlist = async (
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

    const wishlist = await Wishlist.find({
      user: userObjectId,
    }).populate("product");

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const removeFromWishlist = async (
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

    await Wishlist.findOneAndDelete({
      user: userObjectId,
      product: productObjectId,
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};