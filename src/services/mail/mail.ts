import nodemailer from "nodemailer";

import { mailConfig } from "../../config/mail.config";

console.log("MAIL HOST:", mailConfig.host);
console.log("MAIL PORT:", mailConfig.port);
console.log("MAIL USER:", mailConfig.username);

const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: false,

  auth: {
    user: mailConfig.username,
    pass: mailConfig.password,
  },

  // Connection timeout
  connectionTimeout: 10000,
});

transporter.verify((error, success) => {
  if (error) {
    console.error(
      "SMTP CONNECTION ERROR:",
      error
    );
  } else {
    console.log(
      "SMTP SERVER READY:",
      success
    );
  }
});

export default transporter;