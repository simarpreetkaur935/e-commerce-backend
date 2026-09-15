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
import { registerValidations } from "../app/Middleware/Validations.middleware";
import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";
import { loginValidations } from "../app/Middleware/Validations.middleware";

const authRoutes = express.Router();

// Register
authRoutes.post("/register", registerValidations, ErrorsCheck, register);

// Login
authRoutes.post("/login",loginValidations, ErrorsCheck, login);

// Logout
authRoutes.post("/logout", logout);

// Current user
authRoutes.get("/me", getMe);

// Forgot password - generate OTP
authRoutes.post("/forgot-password", forgotPassword);

// Reset password - verify OTP and change password
authRoutes.post("/reset-password", resetPassword);

// Refresh access token
authRoutes.post("/refresh-token", refreshAccessToken);

export default authRoutes;