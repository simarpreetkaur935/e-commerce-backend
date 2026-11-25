import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
        permissions?: {
          resource: string;
          action: string;
        }[];
      };
    }
  }
}

export {};
