
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
): Promise<void> => {
  try {

    // Build the template path.
    const templatePath = path.join(
      __dirname,
      "templates",
      templateName
    );

    // Check whether the template exists.
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templatePath}`);
    }

    // Read the template file.
    const templateSource = fs.readFileSync(
      templatePath,
      "utf-8"
    );

    // Compile the Handlebars template.
    const template = Handlebars.compile(templateSource);

    // Generate the email HTML.
    const html = template(data);

    // Send the email.
    await transporter.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Send Email Error:", error);
    throw error;
  }
};
