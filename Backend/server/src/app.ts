import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import interviewRoutes from "./routes/interview.routes.js";

import { errorHandler } from "./middleware/error.js";
import { env } from "./config/env.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

import mongoose from "mongoose";
import axios from "axios";

app.get("/api/health", async (_req, res) => {
  let aiEngineStatus = "offline";
  let aiDetails: any = null;
  try {
    const aiRes = await axios.get(`${env.AI_ENGINE_URL}/api/health`, { timeout: 2500 });
    aiEngineStatus = "healthy";
    aiDetails = aiRes.data;
  } catch (err: any) {
    aiEngineStatus = "offline";
  }

  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  res.json({
    success: true,
    service: "intervexa-server",
    status: "healthy",
    database: {
      status: dbStatus,
    },
    aiEngine: {
      status: aiEngineStatus,
      url: env.AI_ENGINE_URL,
      details: aiDetails,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/interview", interviewRoutes);

app.use(errorHandler);

export default app;