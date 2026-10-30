import mongoose, {
  Schema,
  Document,
  Types,
} from "mongoose";

export interface ICart extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.index(
  { user: 1, product: 1 },
  { unique: true }
);

const Cart = mongoose.model<ICart>(
  "Cart",
  cartSchema
);

export default Cart;