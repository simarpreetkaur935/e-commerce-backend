import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./routes/index.routes";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["*"],
  allowedHeaders: [
    "Authorization",
    "apllication/json"
  ],
  methods: [
    'GET', 'POST', "PUT", "PATCH", "Options"
  ]
}));

///routes
app.use("/api/v1", router);

// Test route
app.get("/", (_req, res) => {
  res.send("API is running");
});

// Start server
app.listen(PORT, () => {

  // MongoDB connection
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
