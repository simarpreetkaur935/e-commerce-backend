import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number;

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

  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

const paymentSchema =
  new Schema<IPayment>(
    {
      order: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      amount: {
        type: Number,
        required: true,
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

      stripeSessionId: {
        type: String,
      },

      stripePaymentIntentId: {
        type: String,
      },
    },
    {
      timestamps: true,
    }
  );

const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);

export default Payment;