import nodemailer from "nodemailer";

import { mailConfig } from "../../config/mail.config";

const emailSender =
  nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: false,

    auth: {
      user: mailConfig.username,
      pass: mailConfig.password,
    },
  });

export default emailSender;