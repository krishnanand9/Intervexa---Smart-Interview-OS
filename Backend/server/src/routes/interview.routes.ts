import { Router } from "express";
import {
  startInterview,
  getQuestions,
  submitAnswer,
  completeInterview,
  getInterview,
  getUserInterviews,
  getUserAnalytics,
  testAiConnection,
} from "../controllers/interview.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Test AI endpoint (open or auth)
router.post("/test-ai", testAiConnection);

// Question generation endpoint
router.post("/questions", requireAuth, getQuestions);

// Start new interview session
router.post("/start", requireAuth, startInterview);

// User interviews history
router.get("/user/history", requireAuth, getUserInterviews);

// User performance analytics
router.get("/user/analytics", requireAuth, getUserAnalytics);

// Submit answer for active question
router.post("/:interviewId/answer", requireAuth, submitAnswer);

// Complete interview session
router.post("/:interviewId/complete", requireAuth, completeInterview);

// Get single interview by ID
router.get("/:interviewId", requireAuth, getInterview);

export default router;