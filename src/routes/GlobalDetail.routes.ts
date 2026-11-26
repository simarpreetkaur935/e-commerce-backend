
import { Router } from "express";

import {
  getGlobalOrderDetails,
} from "../app/Controllers/GlobalDetail.controller";

const router = Router();

// =========================
// GLOBAL ADMIN DETAILS
// =========================

router.get("/orders", getGlobalOrderDetails);

export default router;
