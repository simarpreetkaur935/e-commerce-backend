
import { Request, Response } from "express";
import { sendEmail } from "../../services/mail/mail.service";
import Subscription from "../Model/Subscription.model";

export const subscribe = async (req: Request, res: Response) => {
  try {
    const normalizedEmail = String(req.body.email ?? "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Save or reactivate the subscriber in MongoDB.
    const subscription = await Subscription.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          isActive: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Send the welcome email.
    await sendEmail(
      normalizedEmail,
      "Welcome to MyStore!",
      "subscribe.hbs",
      {
        email: normalizedEmail,
        storeUrl:
          process.env.FRONTEND_URL || "http://localhost:5173",
        year: new Date().getFullYear(),
      }
    );

    return res.status(200).json({
      success: true,
      message: "Thank you for subscribing to MyStore!",
      data: {
        email: subscription.email,
        isActive: subscription.isActive,
      },
    });
  } catch (error) {
    console.error("Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your subscription right now.",
    });
  }
};

