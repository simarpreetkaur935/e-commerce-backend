
import cron from "node-cron";
import { sendEmail } from "../mail.service";
import Product from "../../../app/Model/Product.model";
import Subscription from "../../../app/Model/Subscription.model";

let isProcessing = false;
let isCronStarted = false;

export const processSaleNotifications = async (): Promise<void> => {
  if (isProcessing) {
    console.log("Sale notification job is already running.");
    return;
  }

  isProcessing = true;

  try {
    // Find active, in-stock products with a discounted price
    // whose sale notification has not been sent.
    const products = await Product.find({
      isActive: true,
      stock: { $gt: 0 },
      $expr: {
        $and: [
          { $gt: ["$price", 0] },
          { $gt: ["$discountPrice", 0] },
          { $lt: ["$discountPrice", "$price"] },
        ],
      },
      saleNotificationSent: false,
    }).exec();

    if (products.length === 0) {
      console.log("No new sale products found.");
      return;
    }

    // Get all active subscribers.
    const subscribers = await Subscription.find({
      isActive: true,
    })
      .select("email")
      .lean()
      .exec();

    if (subscribers.length === 0) {
      console.log("No active subscribers found.");
      return;
    }

    for (const product of products) {
      const price = Number(product.price);
      const discountPrice = Number(product.discountPrice);

      if (
        !Number.isFinite(price) ||
        !Number.isFinite(discountPrice) ||
        price <= 0 ||
        discountPrice <= 0 ||
        discountPrice >= price
      ) {
        continue;
      }

      const discountPercentage = Math.round(
        ((price - discountPrice) / price) * 100
      );

      let allEmailsSent = true;

      for (const subscriber of subscribers) {
        try {
          await sendEmail(
            subscriber.email,
            `Sale Alert: ${product.name}`,
            "sale.notification.hbs",
            {
              productName: product.name,
              price,
              discountPrice,
              discountPercentage,
              offerTitle: `${product.name} Sale`,
              description: product.description ?? "",
              startDate: undefined,
              endDate: undefined,
            }
          );

          console.log(
            `Sale email sent to ${subscriber.email} for ${product.name}`
          );
        } catch (error) {
          allEmailsSent = false;
          console.error(
            `Failed to send sale email to ${subscriber.email}:`,
            error
          );
        }
      }

      // Mark the product as notified only when all emails succeed.
      if (allEmailsSent) {
        await Product.updateOne(
          {
            _id: product._id,
            saleNotificationSent: false,
          },
          {
            $set: {
              saleNotificationSent: true,
            },
          }
        );

        console.log(
          `Sale notification completed for ${product.name}`
        );
      } else {
        console.error(
          `Some emails failed for ${product.name}; it will be retried.`
        );
      }
    }
  } catch (error) {
    console.error("Sale notification job failed:", error);
  } finally {
    isProcessing = false;
  }
};

// Runs every day at 10:30 AM IST
export const startSaleCron = (): void => {
  if (isCronStarted) return;

  cron.schedule(
    "30 10 * * *",
    () => {
      console.log("Sale Cron triggered:", new Date().toISOString());
      void processSaleNotifications();
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  isCronStarted = true;
  console.log("Sale Cron started: daily at 10:30 AM IST.");
};