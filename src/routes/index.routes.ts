import express from "express";
import authRoutes from "./Auth.routes";
import userRoutes from "./User.routes";
import categoryRoutes from "./Category.routes";
import productRoutes from "./Product.routes";
const router = express.Router();

router.use("/auth", authRoutes)

router.use("/users", userRoutes)

router.use("/categories",categoryRoutes)

router.use("/products", productRoutes)

export default router;