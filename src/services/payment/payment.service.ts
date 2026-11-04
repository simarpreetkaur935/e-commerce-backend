
import stripe from "../../config/stripe.config";
import Stripe from "stripe";

export const createPaymentIntent = async (
  amount: number,
  orderId: string
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "inr",

    automatic_payment_methods: {
      enabled: true,
    },

    metadata: {
      orderId,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

export const getPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};
