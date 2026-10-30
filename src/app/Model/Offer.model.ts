import mongoose, { Document, Schema } from "mongoose";

export interface IOffer extends Document {
  seller: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  offerType: "PERCENTAGE" | "FIXED";
  discountPercentage?: number;
  discountAmount?: number;
  startDate: Date;
  endDate: Date;
  status: "SCHEDULED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  notificationSent: boolean;
  notificationSentAt?: Date | null;
}

const offerSchema = new Schema<IOffer>(
  {
    seller: {
  type: Schema.Types.ObjectId,
  ref: "User",
  required: false,
  index: true,
  default: null,
},

    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      index: true,
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    offerType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      default: "PERCENTAGE",
      required: true,
    },
discountPercentage: {
  type: Number,
  min: 1,
  max: 100,
  required: function (this: IOffer): boolean {
    return this.offerType === "PERCENTAGE";
  },
},

discountAmount: {
  type: Number,
  min: 0.01,
  required: function (this: IOffer): boolean {
    return this.offerType === "FIXED";
  },
},

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["SCHEDULED", "ACTIVE", "EXPIRED", "CANCELLED"],
      default: "SCHEDULED",
      required: true,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Validate the offer date range.
offerSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be later than start date.");
  }
});

// Help queries for a seller's offers on a product.
offerSchema.index({
  seller: 1,
  product: 1,
  status: 1,
});

const Offer = mongoose.model<IOffer>("Offer", offerSchema);

export default Offer;
