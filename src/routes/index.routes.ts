import express from "express";
import authRoutes from "./Auth.routes";
import userRoutes from "./User.routes";
import categoryRoutes from "./Category.routes";
import productRoutes from "./Product.routes";
import wishlistRoutes from "./wishlist.routes";
import cartRoutes from "./Cart.routes";
import paymentRoutes from "./Payment.routes";
import subscriptionRoutes from "./Subscription.routes";
import offersRoutes from  "./Offers.routes";
const router = express.Router();

router.use("/auth", authRoutes)

router.use("/users", userRoutes)

router.use("/categories",categoryRoutes)

router.use("/products", productRoutes)

router.use("/wishlist", wishlistRoutes)

router.use("/cart",cartRoutes)

router.use("/payment",paymentRoutes)

router.use("/subscriptions", subscriptionRoutes);

router.use("/offer", offersRoutes)

export default router;