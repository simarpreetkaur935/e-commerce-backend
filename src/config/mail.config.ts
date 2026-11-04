import "dotenv/config";

export const mailConfig = {
  host: process.env.NODE_APP_MAIL_HOST,
  port: Number(process.env.NODE_APP_MAIL_PORT || 587),
  username: process.env.NODE_APP_MAIL_USERNAME,
  password: process.env.NODE_APP_MAIL_PASSWORD,
  from: process.env.NODE_APP_MAIL_FROM,
};