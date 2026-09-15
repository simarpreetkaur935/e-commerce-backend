import express from "express";
import authRoutes from "./Auth.routes";
import userRoutes from "./User.routes";

const router = express.Router();

router.use("/auth", authRoutes)

router.use("/users", userRoutes)

export default router