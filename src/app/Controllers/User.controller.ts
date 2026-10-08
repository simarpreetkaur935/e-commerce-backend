import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../Model/User.model";

// =========================
// GET MY PROFILE
// =========================

export const getMyProfile = async ( req: Request,res: Response) => {
  try {
    const userId = (req as Request & {
      user?: { id: string };
    }).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "-password -refreshToken -resetPasswordOtp -resetPasswordOtpExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// UPDATE MY PROFILE
// =========================

export const updateMyProfile = async (req: Request,res: Response) => {
  try {
    const userId = (req as Request & {
      user?: { id: string };
    }).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {name, phone,avatar,address,} = req.body;

    const user = await User.findByIdAndUpdate(
      userId,{name,phone,avatar, address,},
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// CHANGE PASSWORD
// =========================

export const changePassword = async ( req: Request,res: Response) => {
  try {
    const userId = (req as Request & {
      user?: { id: string };
    }).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    // Invalidate refresh token
    user.refreshToken = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// =========================
// DELETE MY ACCOUNT
// =========================

export const deleteMyAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as Request & {
      user?: { id: string };
    }).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(userId);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};