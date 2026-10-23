
import { Request, Response } from "express";
import { sendEmail } from "../../services/mail/mail.service";

export const subscribe = async (req: Request, res: Response) => {
  try {
    const normalizedEmail = req.body.email;

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
    });
  } catch (error) {
    console.error("Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your subscription right now.",
    });
  }
};
