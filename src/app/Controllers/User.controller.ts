import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
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
// GET MY GLOBAL DETAILS
// =========================

export const getMyDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

   

    const [user] = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "userroles",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$user_id", "$$userId"] } } },
            {
              $lookup: {
                from: "roles",
                localField: "role_id",
                foreignField: "_id",
                pipeline: [
                  {
                    $lookup: {
                      from: "permissionroles",
                      let: { roleId: "$_id" },
                      pipeline: [
                        { $match: { $expr: { $eq: ["$role_id", "$$roleId"] } } },
                        {
                          $lookup: {
                            from: "permissions",
                            localField: "permission_id",
                            foreignField: "_id",
                            pipeline: [
                              { $project: { name: 1, resource: 1, action: 1, description: 1 } },
                            ],
                            as: "permission",
                          },
                        },
                        { $unwind: "$permission" },
                        { $replaceRoot: { newRoot: "$permission" } },
                      ],
                      as: "permissions",
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      id: "$_id",
                      name: 1,
                      slug: 1,
                      description: 1,
                      isActive: 1,
                      permissions: 1,
                    },
                  },
                ],
                as: "role",
              },
            },
            { $unwind: "$role" },
            { $replaceRoot: { newRoot: "$role" } },
          ],
          as: "roles",
        },
      },
      {
        $project: {
          password: 0,
          refreshToken: 0,
          resetPasswordOtp: 0,
          resetPasswordOtpExpires: 0,
        },
      },
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { roles, ...userDetails } = user;

    return res.status(200).json({
      success: true,
      user: userDetails,
      roles,
    });
  } catch (error) {
    console.error("Get User Details Error:", error);

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

export const deleteMyAccount = async ( req: Request,res: Response) => {
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
