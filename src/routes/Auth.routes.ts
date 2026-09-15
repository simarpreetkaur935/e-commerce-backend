import express from "express";

import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} from "../app/Controllers/Auth.controller";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

// Current user
router.get("/me", getMe);

// Forgot password - generate OTP
router.post("/forgot-password", forgotPassword);

// Reset password - verify OTP and change password
router.post("/reset-password", resetPassword);

// Refresh access token
router.post("/refresh-token", refreshAccessToken);

export default router;