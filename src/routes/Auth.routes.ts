import express from "express";

import {
  register,
  login,
  logout,
  verifyOtp,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} from "../app/Controllers/Auth.controller";

import {
  registerValidations,
  loginValidations,
  verifyOtpValidations,
  forgotPasswordValidations,
  resetPasswordValidations,
} from "../app/Middleware/Validations.middleware";

import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";

const authRoutes = express.Router();

// =========================
// REGISTER
// =========================

authRoutes.post(
  "/register",
  registerValidations,
  ErrorsCheck,
  register
);

// =========================
// LOGIN
// =========================

authRoutes.post(
  "/login",
  loginValidations,
  ErrorsCheck,
  login
);

// =========================
// LOGOUT
// =========================

authRoutes.post(
  "/logout",
  logout
);

// =========================
// FORGOT PASSWORD
// =========================

authRoutes.post(
  "/forgot-password",
  forgotPasswordValidations,
  ErrorsCheck,
  forgotPassword
);

// =========================
// VERIFY OTP
// =========================

authRoutes.post(
  "/verify-otp",
  verifyOtpValidations,
  ErrorsCheck,
  verifyOtp
);

// =========================
// RESET PASSWORD
// =========================

authRoutes.post(
  "/reset-password",
  resetPasswordValidations,
  ErrorsCheck,
  resetPassword
);

// =========================
// REFRESH ACCESS TOKEN
// =========================

authRoutes.post(
  "/refresh-token",
  refreshAccessToken
);

export default authRoutes;