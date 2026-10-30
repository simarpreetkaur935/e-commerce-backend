import Stripe from "stripe";

// Stripe is initialized once and reused across the app
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-09-30.endive", // Always pin to a specific version
  typescript: true,
});

export default stripe;