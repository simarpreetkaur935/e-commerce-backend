import mongoose, { Document, Schema } from "mongoose";

export interface IProductSeller extends Document {
  product: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
}

const productSellerSchema = new Schema<IProductSeller>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

productSellerSchema.index({ product: 1 }, { unique: true });

const ProductSeller = mongoose.model<IProductSeller>(
  "ProductSeller",
  productSellerSchema,
);

export default ProductSeller;
