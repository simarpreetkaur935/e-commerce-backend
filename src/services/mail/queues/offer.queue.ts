
import { sendEmail } from "../mail.service";
import Subscription from "../../../app/Model/Subscription.model";
import Offer from "../../../app/Model/Offer.model";

// 1. Define the offer job structure
interface OfferEmailJob {
  offerId: string;
}

// 2. Define the email template data
type OfferEmailData = Record<string, unknown> & {
  productName: string;
  price: number;
  discountPrice: number;
  discountPercentage: number;
  offerTitle: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
};

// 3. Create the FIFO queue
const offerQueue: OfferEmailJob[] = [];
const queuedOfferIds = new Set<string>();
let isProcessing = false;

// 4. Add an offer notification job
export const addOfferEmailJob = (offerId: string): void => {
  if (queuedOfferIds.has(offerId)) return;

  queuedOfferIds.add(offerId);
  offerQueue.push({ offerId });

  console.log("Offer job added:", offerId);

  void processOfferQueue();
};

// 5. Process jobs sequentially
const processOfferQueue = async (): Promise<void> => {
  if (isProcessing) return;

  isProcessing = true;

  try {
    while (offerQueue.length > 0) {
      const job = offerQueue.shift();
      if (!job) continue;

      try {
        await processOfferEmail(job);
      } catch (error) {
        console.error("Offer email job failed:", error);
      } finally {
        queuedOfferIds.delete(job.offerId);
      }
    }
  } finally {
    isProcessing = false;

    if (offerQueue.length > 0) {
      void processOfferQueue();
    }
  }
};

// 6. Process one offer notification
const processOfferEmail = async (
  job: OfferEmailJob
): Promise<void> => {
  const offer = await Offer.findById(job.offerId).populate("product");

  if (!offer || offer.status !== "ACTIVE") {
    console.log("Offer not found or inactive:", job.offerId);
    return;
  }

  if (offer.notificationSent) {
    console.log("Offer already notified:", job.offerId);
    return;
  }

  // Validate the populated product
  const product = offer.product as unknown as {
    name: string;
    price: number;
  } | null;

  if (
    !product ||
    typeof product.name !== "string" ||
    !Number.isFinite(Number(product.price)) ||
    Number(product.price) <= 0
  ) {
    console.error("Invalid offer product:", job.offerId);
    return;
  }

  const productName = product.name;
  const price = Number(product.price);

  // 7. Calculate discounted price
  let discountPrice: number;

  if (offer.offerType === "PERCENTAGE") {
    const percentage = Number(offer.discountPercentage);

    if (
      !Number.isFinite(percentage) ||
      percentage <= 0 ||
      percentage >= 100
    ) {
      console.error("Invalid offer percentage:", job.offerId);
      return;
    }

    discountPrice = price * (1 - percentage / 100);
  } else if (offer.offerType === "FIXED") {
    const amount = Number(offer.discountAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount >= price
    ) {
      console.error("Invalid offer amount:", job.offerId);
      return;
    }

    discountPrice = price - amount;
  } else {
    console.error("Unsupported offer type:", offer.offerType);
    return;
  }

  if (
    !Number.isFinite(discountPrice) ||
    discountPrice <= 0 ||
    discountPrice >= price
  ) {
    console.error("Invalid discounted price:", job.offerId);
    return;
  }

  discountPrice = Math.round((discountPrice + Number.EPSILON) * 100) / 100;

  const discountPercentage = Math.round(
    ((price - discountPrice) / price) * 100
  );

  // 8. Prepare email data
  const emailData: OfferEmailData = {
    productName,
    price,
    discountPrice,
    discountPercentage,
    offerTitle: offer.title,
    description: offer.description,
    startDate: offer.startDate,
    endDate: offer.endDate,
  };

  // 9. Find active subscribers
  const subscribers = await Subscription.find({ isActive: true })
    .select("email")
    .lean()
    .exec();

  if (subscribers.length === 0) {
    console.log("No active subscribers found.");
    return;
  }

  let allEmailsSent = true;

  // 10. Send emails sequentially
  for (const subscriber of subscribers) {
    try {
      await sendEmail(
        subscriber.email,
        `Offer Alert: ${offer.title}`,
        "sale.notification.hbs",
        emailData
      );

      console.log("Offer email sent to:", subscriber.email);
    } catch (error) {
      allEmailsSent = false;
      console.error(
        `Failed to send offer email to ${subscriber.email}:`,
        error
      );
    }
  }

  // 11. Mark notification complete only if every send succeeds
  if (allEmailsSent) {
    const result = await Offer.updateOne(
      {
        _id: job.offerId,
        notificationSent: false,
      },
      {
        $set: {
          notificationSent: true,
          notificationSentAt: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log("Offer notification completed:", job.offerId);
    }
  }
};

// 12. Listen for offer inserts and updates using MongoDB Change Streams
export const startOfferChangeStream = (): void => {
  const offerChangeStream = Offer.watch([
    {
      $match: {
        operationType: { $in: ["insert", "update", "replace"] },
      },
    },
  ]);                               

  offerChangeStream.on("change", (change) => {
    // For inserts/replacements, use the full document.
    // For updates, fetch the latest offer document.
    const offerId = change.documentKey?._id?.toString();

    if (!offerId) return;

    void (async () => {
      try {
        const offer = await Offer.findById(offerId)
          .select("_id status notificationSent")
          .lean()
          .exec();

        if (
          offer &&
          offer.status === "ACTIVE" &&
          !offer.notificationSent
        ) {
          addOfferEmailJob(offer._id.toString());
        }
      } catch (error) {
        console.error("Failed to process offer change:", error);
      }
    })();
  });

  offerChangeStream.on("error", (error) => {
    console.error("Offer Change Stream error:", error);
  });

  console.log("Offer Change Stream started.");
};