import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.NODE_APP_STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

const stripe = new Stripe(
  process.env.NODE_APP_STRIPE_SECRET_KEY
);

export default stripe;