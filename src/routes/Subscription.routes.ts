
import { Router } from "express";
import { subscribe } from "../app/Controllers/Subscription.controller";
import { subscriptionValidation } from "../app/Middleware/Validations.middleware";
import { ErrorsCheck } from "../app/Middleware/ErrorsCheck.middleware";

const router = Router();

router.post(
  "/",
  subscriptionValidation,
  ErrorsCheck,
  subscribe
);

export default router;

