import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../Model/User.model";
import { accessToken, refreshToken } from "../../utils/Token.util";

  export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      avatar,
      address,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      avatar,
      address,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
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
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// =========================
// LOGIN
// =========================
export const login = async (req: Request, res: Response) => {
  try {
    const { password, user } = req.body;

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user!.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Save refresh token
    user!.refreshToken = refreshToken({
      id: user._id,
      name: user.name,
      email: user.email,
    });
    await user!.save();

    // Send refresh token as HTTP-only cookie
    res.cookie("refreshToken", user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: accessToken({
        id: user._id,
        name: user.name,
        email: user.email,
      }),
      user: {
        id: user!._id,
        name: user!.name,
        email: user!.email,
        phone: user!.phone,
        avatar: user!.avatar,
        address: user!.address,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// LOGOUT
// =========================
export const logout = async (_req: Request, res: Response) => {
  try {
    const refreshToken = _req.cookies?.refreshToken;

    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } },
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// FORGOT PASSWORD - GENERATE OTP
// =========================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { user } = req.body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP
    user!.resetPasswordOtp = otp;

    // OTP expires in 10 minutes
    user!.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user!.save();

    // Development only
    console.log("Password Reset OTP:", otp);

    return res.status(200).json({
      success: true,
      message: "Email verified. OTP generated successfully",
      otp,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// RESET PASSWORD WITH OTP
// =========================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { user, password } = req.body;

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    user!.password = hashedPassword;

    // Remove OTP after successful reset
    user!.resetPasswordOtp = undefined;
    user!.resetPasswordOtpExpires = undefined;

    // Invalidate old refresh token
    user!.refreshToken = undefined;

    // Save user
    await user!.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// REFRESH ACCESS TOKEN
// =========================
export const refreshAccessToken = async (
  req: Request,
  res: Response
) => {
  try {
    const currentRefreshToken =
      req.cookies?.refreshToken;

    if (!currentRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });
    }

    const jwtSecret =
      process.env.NODE_APP_JWT_SECRET_KEY;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not configured",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      currentRefreshToken,
      jwtSecret
    ) as {
      id: string;
    };

    // Check token exists in database
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: currentRefreshToken,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Create new access token
    const newAccessToken = accessToken({
      id: String(user._id),
      name: user.name,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error(
      "Refresh Token Error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired refresh token",
    });
  }
};