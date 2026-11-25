import express from "express";
import { protect } from "../app/Middleware/Auth.middleware";
import { index } from "../app/Controllers/GlobalDetail.controller";


const router = express.Router();


router.get("/", protect, index );

export default router;