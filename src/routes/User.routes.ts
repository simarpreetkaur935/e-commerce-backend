import express from "express";

import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  deleteMyAccount,
} from "../app/Controllers/User.controller";

import { protect } from "../app/Middleware/Auth.middleware";

const userRoutes = express.Router();

userRoutes.get("/me",  protect, getMyProfile);

userRoutes.put("/me",protect,  updateMyProfile);

userRoutes.put("/change-password", protect, changePassword);

userRoutes.delete("/me", protect, deleteMyAccount);

export default userRoutes;