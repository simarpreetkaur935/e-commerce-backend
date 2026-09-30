import emailSender from "./mail";

import { mailConfig } from "../../config/mail.config";

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    await emailSender.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error(
      "Send Email Error:",
      error
    );

    throw error;
  }
};