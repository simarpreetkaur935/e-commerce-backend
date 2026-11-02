
import { Router } from "express";

import {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../app/Controllers/Address.controller";

import { protect } from "../app/Middleware/Auth.middleware";

const router = Router();

// Add new address
router.post("/add", protect, addAddress);

// Get all user addresses
router.get("/", protect, getAddresses);

// Update address
router.put("/:addressId", protect, updateAddress);

// Delete address
router.delete("/:addressId", protect, deleteAddress);

// Set default address
router.patch("/:addressId/default", protect, setDefaultAddress);

export default router;
