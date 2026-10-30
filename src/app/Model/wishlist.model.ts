
import mongoose ,  {Schema, Document, Types,} from "mongoose";

 export interface IWishlist extends Document {
    user: Types.ObjectId;
    product: Types.ObjectId;
    createdAt:Date;
    updatedAt: Date;

}

const wishlistSchema = new Schema <IWishlist>(
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
  },
  {
    timestamps: true,
  }
);

// Prevent the same user from adding the same product twice
wishlistSchema.index(
  { user: 1, product: 1 },
  { unique: true }
);
   
const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);
export default Wishlist;



