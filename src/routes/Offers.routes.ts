
import { Router } from "express";
import {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  cancelOffer,
} from "../app/Controllers/Offer.controller";

const router = Router();

// Create a new offer
router.post("/", createOffer);

// Get all offers, with optional filters
router.get("/", getAllOffers);

// Get a specific offer
router.get("/:id", getOfferById);

// Update an offer
router.patch("/:id", updateOffer);

// Cancel an offer
router.patch("/:id/cancel", cancelOffer);

export default router;
