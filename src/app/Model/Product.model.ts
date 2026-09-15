import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  // Basic Information
  name: string;
  description: string;
  brand?: string;
  category: mongoose.Types.ObjectId;
  images: string[];

  // Pricing
  price: number;
  discountPrice?: number;
  tax?: number;

  // Inventory
  stock: number;
  sku: string;
  lowStockThreshold: number;

  // Product Details
  specifications: Map<string, string>;
  tags: string[];
  weight?: number;

  // Ratings
  averageRating: number;
  totalReviews: number;

  // Status
  isActive: boolean;
  isFeatured: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    // =========================
    // BASIC INFORMATION
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    // =========================
    // PRICING
    // =========================

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    tax: {
      type: Number,
      min: 0,
    },

    // =========================
    // INVENTORY
    // =========================

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    // =========================
    // PRODUCT DETAILS
    // =========================

    specifications: {
      type: Map,
      of: String, 
      default: {},
    },

    tags: {
      type: [String],
      default: [],
    },

    weight: {
      type: Number,
      min: 0,
    },

    // =========================
    // RATINGS
    // =========================

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // STATUS
    // =========================

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model<IProduct>(
  "Product",
  productSchema
);

export default Product;
