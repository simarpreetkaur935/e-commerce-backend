
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Address from "../Model/Address.model";

// Add Address
export const addAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const {
      street,
      city,
      state,
      country,
      pincode,
      isDefault,
    } = req.body;

    if (!street || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Street, city, state and pincode are required",
      });
    }

    const existingAddresses = await Address.countDocuments({
      user: userId,
      deletedAt: null,
    });

    const shouldBeDefault =
      existingAddresses === 0 || isDefault === true;

    const address = await Address.create({
      user: userId,
      street,
      city,
      state,
      country: country || "India",
      pincode,
      isDefault: shouldBeDefault,
    });

    // Remove default status from other addresses
    if (shouldBeDefault) {
      await Address.updateMany(
        {
          user: userId,
          _id: { $ne: address._id },
          deletedAt: null,
        },
        {
          $set: { isDefault: false },
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};


// Get All Addresses
export const getAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const addresses = await Address.find({
      user: userId,
      deletedAt: null,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};


// Update Address
export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
   const userId = (req as any).user?.id;
    const addressId = req.params.addressId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Validate address ID
    if (
      typeof addressId !== "string" ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const {
      street,
      city,
      state,
      country,
      pincode,
      isDefault,
    } = req.body;

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
      deletedAt: null,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Update provided fields
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (country !== undefined) address.country = country;
    if (pincode !== undefined) address.pincode = pincode;

    // Set this address as default
    if (isDefault === true) {
      await Address.updateMany(
        {
          user: userId,
          _id: { $ne: addressId },
          deletedAt: null,
        },
        {
          $set: { isDefault: false },
        }
      );

      address.isDefault = true;
    }

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};


// Delete Address (Soft Delete)
export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
   const userId = (req as any).user?.id;
    const addressId = req.params.addressId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Validate address ID
    if (
      typeof addressId !== "string" ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
      deletedAt: null,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    // Soft delete address
    address.deletedAt = new Date();
    address.isDefault = false;

    await address.save();

    // If deleted address was default,
    // assign default status to another active address
    if (wasDefault) {
      await Address.findOneAndUpdate(
        {
          user: userId,
          deletedAt: null,
        },
        {
          $set: { isDefault: true },
        },
        {
          new: true,
          sort: { createdAt: -1 },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


// Set Default Address
export const setDefaultAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
  const userId = (req as any).user?.id;
    const addressId = req.params.addressId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Validate address ID
    if (
      typeof addressId !== "string" ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
      deletedAt: null,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default status from all other addresses
    await Address.updateMany(
      {
        user: userId,
        _id: { $ne: addressId },
        deletedAt: null,
      },
      {
        $set: { isDefault: false },
      }
    );

    address.isDefault = true;

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};
