import { Payload } from "../types/token.type";
import jwt from "jsonwebtoken";

export const accessToken = (payload: Payload) => {
  return jwt.sign(payload, process.env.NODE_APP_JWT_SECRET_KEY!, {
    expiresIn: (process.env.NODE_APP_JWT_ACCESS_TOKEN_EXPIRATION ??
      "15m") as jwt.SignOptions["expiresIn"],
  });
};

export const refreshToken = (payload: Payload) => {
  return jwt.sign(payload, process.env.NODE_APP_JWT_SECRET_KEY!, {
    expiresIn: (process.env.NODE_APP_JWT_REFRESH_TOKEN_EXPIRATION ??
      "7d") as jwt.SignOptions["expiresIn"],
  });
};
