import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;

  items: IOrderItem[];

  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };

  subtotal: number;
  tax: number;
  shippingCharge: number;
  discount: number;
  totalAmount: number;

  paymentMethod:
    | "cod"
    | "credit_card"
    | "debit_card"
    | "net_banking"
    | "upi";

  paymentStatus:
    | "pending"
    | "paid"
    | "failed";

  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

  coupon?: mongoose.Types.ObjectId;
}

const orderSchema =
  new Schema<IOrder>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      items: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },

          name: {
            type: String,
            required: true,
          },

          image: {
            type: String,
          },

          quantity: {
            type: Number,
            required: true,
            min: 1,
          },

          price: {
            type: Number,
            required: true,
            min: 0,
          },

          total: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],

      shippingAddress: {
        street: {
          type: String,
          required: true,
        },

        city: {
          type: String,
          required: true,
        },

        state: {
          type: String,
          required: true,
        },

        country: {
          type: String,
          required: true,
        },

        pincode: {
          type: String,
          required: true,
        },
      },

      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },

      tax: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
  
      shippingCharge: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      discount: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      paymentMethod: {
        type: String,
        enum: [
          "cod",
          "credit_card",
          "debit_card",
          "net_banking",
          "upi",
        ],
        required: true,
      },

      paymentStatus: {
        type: String,
        enum: [
          "pending",
          "paid",
          "failed",
        ],
        default: "pending",
      },

      orderStatus: {
        type: String,
        enum: [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ],
        default: "pending",
      },

      coupon: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
      },
    },
    {
      timestamps: true,
    }
  );

const Order = mongoose.model<IOrder>(
  "Order",
  orderSchema
);

export default Order;