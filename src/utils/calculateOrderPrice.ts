import mongoose from "mongoose";

// PAYMENT METHODS
export type PaymentMethod = "cod" | "stripe";

// CART ITEM INTERFACE
interface ICartItem {
  product: {
    _id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    discountPrice?: number;
    tax?: number;
    images?: string[];
  };
  quantity: number;
}

// ORDER PRICE INTERFACE
export interface IOrderPrice {
  originalSubtotal: number;
  subtotal: number;
  discount: number;
  tax: number;
  shippingCharge: number;
  totalAmount: number;
}

// CONSTANTS
const GST_RATE = 18;
const COD_CHARGE_RATE = 10;

// CALCULATE ORDER PRICE
const calculateOrderPrice = (
  cartItems: ICartItem[],
  paymentMethod: PaymentMethod
): IOrderPrice => {

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  let originalSubtotal = 0;
  let subtotal = 0;
  let discount = 0;

  for (const item of cartItems) {

    if (!item.product) {
      throw new Error("Product not found in cart");
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error("Invalid product quantity");
    }

    const { price, discountPrice } = item.product;

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Invalid product price");
    }

    const finalPrice =
      discountPrice != null &&
      discountPrice >= 0 &&
      discountPrice < price
        ? discountPrice
        : price;

    const originalItemTotal = price * item.quantity;
    const finalItemTotal = finalPrice * item.quantity;

    originalSubtotal += originalItemTotal;
    subtotal += finalItemTotal;
    discount += originalItemTotal - finalItemTotal;
  }

  // GST CALCULATION (18%)
  const tax = Number(
    (subtotal * (GST_RATE / 100)).toFixed(2)
  );

  // COD CHARGES (10%)
  const shippingCharge =
    paymentMethod === "cod"
      ? Number(
          (subtotal * (COD_CHARGE_RATE / 100)).toFixed(2)
        )
      : 0;

  // FINAL AMOUNT
  const totalAmount = Number(
    (subtotal + tax + shippingCharge).toFixed(2)
  );

  return {
    originalSubtotal: Number(originalSubtotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax,
    shippingCharge,
    totalAmount,
  };
};

export default calculateOrderPrice;