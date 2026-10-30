import Stripe from "stripe";
import stripe from "../../config/stripe.config";

export const createPaymentSession = async (
  amount: number,
  orderId: string
): Promise<Stripe.Checkout.Session> => {
  const session =
    await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",

            product_data: {
              name: "E-Commerce Order",
            },

            unit_amount: amount * 100,
          },

          quantity: 1,
        },
      ],

      metadata: {
        orderId,
      },

      success_url:
        "http://localhost:5173/payment/success",

      cancel_url:
        "http://localhost:5173/payment/cancel",
    });

  return session;
};


export const getPaymentSession = async (
  sessionId: string
): Promise<Stripe.Checkout.Session> => {
  const session =
    await stripe.checkout.sessions.retrieve(
      sessionId
    );

  return session;
};
