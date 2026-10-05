import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

import transporter from "./mail";

import { mailConfig } from "../../config/mail.config";

export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, unknown>
) => {
  try {
    const templatePath = path.join(
      __dirname,
      "templates",
      "auth",
      templateName
    );

    const templateSource = fs.readFileSync(
      templatePath,
      "utf-8"
    );

    const template =
      Handlebars.compile(templateSource);

    const html = template(data);

    await transporter.sendMail({
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