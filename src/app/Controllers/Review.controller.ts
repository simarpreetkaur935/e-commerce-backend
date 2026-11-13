import { Request, Response } from "express";
import Review from "../Model/Review.model";
import Product from "../Model/Product.model";

//create review
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const { productId, rating, comment } = req.body;
    // const product = await Product.findById(productId);

    // // if (!product) {
    // //   return res.status(404).json({ success: false, message: "Product not found" });
    // // }

    // // const existingReview = await Review.findOne({ user: userId, product: productId });
    // // if (existingReview) {
    // //   return res.status(409).json({
    // //     success: false,
    // //     message: "You have already reviewed this product",
    // //   });
    // // }

    const review = await Review.create({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    console.error("Create Review Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
//get review

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // const product = await Product.findById(productId);

    // if (!product) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Product not found",
    //   });
    // }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    // Calculate total reviews
    const totalReviews = reviews.length;

    // Calculate average rating
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    return res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error) {
    console.error("Get Product Reviews Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//get my review
export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const reviews = await Review.find({ user: userId })
      .populate("product", "name images price")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    console.error("Get My Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
//update review
// update review
export const updateReview = async (req: Request, res: Response) => {
  try {
    throw new Error("here i am", { cause: "in this line tis is the erropr", statusCode: 400 })
    const userId = req.user?.id;

    const { reviewId } = req.params;
    // const { rating, comment, xyz } = req.body;

    // if (rating === undefined && comment === undefined) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Please provide something to update",
    //   });
    // }

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, user: userId },
      { $set: { ...req.body } },
      { new: true, runValidators: true },
    );

    if (!review) {
      // return res.status(404).json({
      //   success: false,
      //   message: "Review not found or you are not authorized to update it",
      // });
      throw new Error(
        "Review not found or you are not authorized to update it",
      );
    }

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update Review Error:", error);

    return res.status(error.statusCode).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
//del review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const { reviewId } = req.params;
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you are not authorized to delete it",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
