export const mailConfig = {
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  username: process.env.MAIL_USERNAME,
  password: process.env.MAIL_PASSWORD,
  from: process.env.MAIL_FROM,
};