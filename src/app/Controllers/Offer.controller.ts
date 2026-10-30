
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Offer from "../Model/Offer.model";

// CREATE OFFER
export const createOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      seller,
      product,
      title,
      description,
      offerType = "PERCENTAGE",
      discountPercentage,
      discountAmount,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
  if (!product || !title || !startDate || !endDate) {
  res.status(400).json({
    success: false,
    message: "Product, title, start date and end date are required.",
  });
  return;
}

    // Validate seller and product IDs
    if (
  typeof product !== "string" ||
  !mongoose.Types.ObjectId.isValid(product) ||
  (seller != null &&
    (typeof seller !== "string" ||
      !mongoose.Types.ObjectId.isValid(seller)))
) {
  res.status(400).json({
    success: false,
    message: "Invalid seller or product ID.",
  });
  return;
}
    // Validate offer type
    if (!["PERCENTAGE", "FIXED"].includes(offerType)) {
      res.status(400).json({
        success: false,
        message: "Invalid offer type.",
      });
      return;
    }

    // Validate percentage discount
    if (offerType === "PERCENTAGE") {
      const percentage = Number(discountPercentage);

      if (
        discountPercentage == null ||
        !Number.isFinite(percentage) ||
        percentage < 1 ||
        percentage > 100
      ) {
        res.status(400).json({
          success: false,
          message: "Discount percentage must be between 1 and 100.",
        });
        return;
      }
    }

    // Validate fixed discount
    if (offerType === "FIXED") {
      const amount = Number(discountAmount);

      if (
        discountAmount == null ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        res.status(400).json({
          success: false,
          message: "Discount amount must be greater than zero.",
        });
        return;
      }
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      res.status(400).json({
        success: false,
        message:
          "Please provide valid dates. End date must be after start date.",
      });
      return;
    }

    const now = new Date();

    const status =
      start <= now && end > now ? "ACTIVE" : "SCHEDULED";

   const offer = await Offer.create({
  ...(seller ? { seller } : {}),
  product,
      title,
      description,
      offerType,
      discountPercentage:
        offerType === "PERCENTAGE"
          ? Number(discountPercentage)
          : undefined,
      discountAmount:
        offerType === "FIXED"
          ? Number(discountAmount)
          : undefined,
      startDate: start,
      endDate: end,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Offer created successfully.",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL OFFERS
export const getAllOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { seller, product, status } = req.query;

    const filter: Record<string, unknown> = {};

    if (typeof seller === "string") {
      if (!mongoose.Types.ObjectId.isValid(seller)) {
        res.status(400).json({
          success: false,
          message: "Invalid seller ID.",
        });
        return;
      }

      filter.seller = seller;
    }

    if (typeof product === "string") {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
        return;
      }

      filter.product = product;
    }

    if (typeof status === "string") {
      if (
        !["SCHEDULED", "ACTIVE", "EXPIRED", "CANCELLED"].includes(
          status
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid offer status.",
        });
        return;
      }

      filter.status = status;
    }

    const offers = await Offer.find(filter)
      .populate("seller", "name email")
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};

// GET OFFER BY ID
export const getOfferById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (
      typeof id !== "string" ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
      return;
    }

    const offer = await Offer.findById(id)
      .populate("seller", "name email")
      .populate("product");

    if (!offer) {
      res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE OFFER
export const updateOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (
      typeof id !== "string" ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
      return;
    }

    // Only allow these fields to be updated
    const allowedFields = [
      "title",
      "description",
      "offerType",
      "discountPercentage",
      "discountAmount",
      "startDate",
      "endDate",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
      return;
    }

    if (
      offer.status === "CANCELLED" ||
      offer.status === "EXPIRED"
    ) {
      res.status(400).json({
        success: false,
        message: "Cancelled or expired offers cannot be updated.",
      });
      return;
    }

    // Apply updates
    Object.assign(offer, updates);

    // Recalculate status using the updated dates
    const now = new Date();

    if (offer.endDate <= now) {
      offer.status = "EXPIRED";
    } else if (offer.startDate <= now) {
      offer.status = "ACTIVE";
    } else {
      offer.status = "SCHEDULED";
    }

    await offer.save();

    res.status(200).json({
      success: true,
      message: "Offer updated successfully.",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

// CANCEL OFFER
export const cancelOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (
      typeof id !== "string" ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
      return;
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
      return;
    }

    if (offer.status === "CANCELLED") {
      res.status(400).json({
        success: false,
        message: "Offer is already cancelled.",
      });
      return;
    }

    offer.status = "CANCELLED";
    await offer.save();

    res.status(200).json({
      success: true,
      message: "Offer cancelled successfully.",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};
