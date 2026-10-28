
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./routes/index.routes";
import { startOfferChangeStream } from "./services/mail/queues/offer.queue";
import { startSaleCron } from "./services/mail/queues/sale.queue";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/v1", router);

// Test route
app.get("/", (_req, res) => {
  res.send("API is running");
});

// Start server

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to MongoDB first
    await connectDB();

    // 2. Start listening for MongoDB offer changes
    startOfferChangeStream();

    // 3. Start the sale notification cron job
    startSaleCron();

    // 4. Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

void startServer();

