import { Request, Response } from "express";
import mongoose from "mongoose";
import Interview from "../models/Interview.js";
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateNextConversationalQuestion,
  testAiEnginePrompt,
} from "../services/ai.service.js";
import { enqueueConversationTurn } from "../queue/conversationQueue.js";

function getUserId(req: Request): string | null {
  const user = (req as any).user;
  if (!user) return null;
  const id = user.userId ?? user.id ?? user._id;
  return id ? String(id) : null;
}

function getInterviewId(req: Request): string {
  return String(req.params.interviewId ?? "");
}

function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

/**
 * POST /api/interview/start
 * Initialize a new real-time interview session.
 */
export async function startInterview(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      role = "Software Engineer",
      interviewType = "mixed",
      experienceLevel = "mid",
      numberOfQuestions = 5,
      skillsOrResume,
      jobDescription,
    } = req.body;

    // Generate initial questions from AI Engine
    const generated = await generateInterviewQuestions({
      role,
      interviewType,
      experienceLevel,
      numberOfQuestions,
      skillsOrResume,
      jobDescription,
    });

    const questionsList = (generated.questions || []).map((q: any, idx: number) => ({
      questionId: `q-${idx + 1}-${Date.now()}`,
      question: q.question,
      category: q.category || interviewType,
      difficulty: q.difficulty || experienceLevel,
      answer: "",
    }));

    const interview = new Interview({
      userId: new mongoose.Types.ObjectId(userId),
      title: `${role} (${interviewType.toUpperCase()})`,
      role,
      interviewType,
      experienceLevel,
      status: "in_progress",
      questions: questionsList,
      totalQuestions: questionsList.length,
      answeredQuestions: 0,
      currentQuestionIndex: 0,
      startedAt: new Date(),
      conversationTimeline: questionsList[0]
        ? [
            {
              speaker: "ai",
              text: questionsList[0].question,
              timestamp: new Date(),
            },
          ]
        : [],
    });

    await interview.save();

    return res.status(201).json({
      success: true,
      message: "Interview started successfully",
      data: interview,
    });
  } catch (error: any) {
    console.error("startInterview error:", error);
    return res.status(500).json({ success: false, message: "Failed to start interview" });
  }
}

/**
 * POST /api/interview/questions
 * Standalone question generation endpoint.
 */
export async function getQuestions(req: Request, res: Response) {
  try {
    const {
      role = "Software Engineer",
      interviewType = "mixed",
      experienceLevel = "mid",
      numberOfQuestions = 5,
    } = req.body;

    const data = await generateInterviewQuestions({
      role,
      interviewType,
      experienceLevel,
      numberOfQuestions,
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to generate questions" });
  }
}

/**
 * POST /api/interview/:interviewId/answer
 * Real-time answer submission:
 * Evaluates answer, updates system prompt context, generates next question or marks completion.
 */
export async function submitAnswer(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const interviewId = getInterviewId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!interviewId || !isValidObjectId(interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID" });
    }

    const {
      questionId,
      answer,
      audioDurationSeconds = 0,
    } = req.body as {
      questionId?: string;
      answer?: string;
      audioDurationSeconds?: number;
    };

    if (!questionId) {
      return res.status(400).json({ success: false, message: "Question ID is required" });
    }

    const trimmedAnswer = (answer || "").trim();
    if (!trimmedAnswer) {
      return res.status(400).json({ success: false, message: "Answer is required" });
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    const questionIndex = interview.questions.findIndex(
      (item) => item.questionId === questionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const currentQuestion = interview.questions[questionIndex];
    currentQuestion.answer = trimmedAnswer;
    currentQuestion.answeredAt = new Date();
    currentQuestion.audioDurationSeconds = audioDurationSeconds;

    // Log candidate's response to timeline
    interview.conversationTimeline.push({
      speaker: "candidate",
      text: trimmedAnswer,
      timestamp: new Date(),
      audioDurationSeconds,
    });

    // Build history for conversational AI system prompt context
    const conversationHistory = interview.conversationTimeline.map((msg) => ({
      role: msg.speaker === "ai" ? "assistant" : "user",
      content: msg.text,
    }));

    // Call AI Engine for real-time conversational next-question and evaluation
    const nextResponse = await generateNextConversationalQuestion({
      role: interview.role,
      interviewType: interview.interviewType,
      experienceLevel: interview.experienceLevel,
      currentQuestion: currentQuestion.question,
      candidateAnswer: trimmedAnswer,
      questionIndex: questionIndex + 1,
      totalQuestions: interview.totalQuestions || interview.questions.length,
      conversationHistory,
    });

    // Store evaluation for this question
    currentQuestion.evaluation = {
      score: Number(nextResponse.evaluation?.score ?? 70),
      clarity: Number(nextResponse.evaluation?.clarity ?? 70),
      relevance: Number(nextResponse.evaluation?.relevance ?? 70),
      structure: Number(nextResponse.evaluation?.structure ?? 70),
      confidence: Number(nextResponse.evaluation?.confidence ?? 70),
      conciseness: Number(nextResponse.evaluation?.conciseness ?? 70),
      strengths: Array.isArray(nextResponse.evaluation?.strengths)
        ? nextResponse.evaluation.strengths.map(String)
        : [],
      suggestions: Array.isArray(nextResponse.evaluation?.suggestions)
        ? nextResponse.evaluation.suggestions.map(String)
        : [],
      feedback: String(nextResponse.evaluation?.feedback || "Answer recorded successfully."),
    };

    // Calculate cumulative real-time scores
    const evaluatedQuestions = interview.questions.filter((q) => q.evaluation);
    const count = evaluatedQuestions.length;
    if (count > 0) {
      const avgScore = evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0) / count;
      const avgClarity = evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.clarity || 0), 0) / count;
      const avgRelevance = evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.relevance || 0), 0) / count;
      const avgStructure = evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.structure || 0), 0) / count;
      const avgConfidence = evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.confidence || 0), 0) / count;
      const avgConciseness = evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.conciseness || 0), 0) / count;

      interview.overallScore = Math.round(avgScore);
      interview.scores = {
        clarity: Math.round(avgClarity),
        relevance: Math.round(avgRelevance),
        structure: Math.round(avgStructure),
        confidence: Math.round(avgConfidence),
        conciseness: Math.round(avgConciseness),
      };
    }

    interview.answeredQuestions = evaluatedQuestions.length;

    // Check if next dynamic question was provided or if session is complete
    const isCompleted = nextResponse.isCompleted || questionIndex + 1 >= interview.questions.length;
    
    if (!isCompleted && nextResponse.nextQuestion) {
      // If we don't already have the next question pre-populated, append it
      if (questionIndex + 1 < interview.questions.length) {
        // Update pre-populated question text to conversational version if available
        interview.questions[questionIndex + 1].question = nextResponse.nextQuestion;
      } else {
        interview.questions.push({
          questionId: `q-${interview.questions.length + 1}-${Date.now()}`,
          question: nextResponse.nextQuestion,
          category: nextResponse.category || interview.interviewType,
          answer: "",
        });
        interview.totalQuestions = interview.questions.length;
      }

      interview.currentQuestionIndex = questionIndex + 1;
      interview.conversationTimeline.push({
        speaker: "ai",
        text: nextResponse.nextQuestion,
        timestamp: new Date(),
      });
    } else if (isCompleted) {
      interview.status = "completed";
      interview.completedAt = new Date();
    }

    await interview.save();

    // Enqueue job for background processing / BullMQ queue
    await enqueueConversationTurn({
      interviewId: interview._id.toString(),
      questionId,
      currentQuestion: currentQuestion.question,
      candidateAnswer: trimmedAnswer,
      role: interview.role,
      interviewType: interview.interviewType,
      experienceLevel: interview.experienceLevel,
      questionIndex: questionIndex + 1,
      totalQuestions: interview.totalQuestions,
    });

    return res.status(200).json({
      success: true,
      message: "Answer evaluated and stored in real-time session",
      data: {
        interviewId: interview._id.toString(),
        questionId,
        evaluation: currentQuestion.evaluation,
        nextQuestion: isCompleted ? null : (interview.questions[questionIndex + 1]?.question || nextResponse.nextQuestion),
        nextQuestionId: isCompleted ? null : interview.questions[questionIndex + 1]?.questionId,
        isCompleted,
        overallScore: interview.overallScore,
        answeredQuestions: interview.answeredQuestions,
        totalQuestions: interview.totalQuestions,
        currentQuestionIndex: interview.currentQuestionIndex,
        session: interview,
      },
    });
  } catch (error) {
    console.error("submitAnswer error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit answer" });
  }
}

/**
 * POST /api/interview/:interviewId/complete
 * Complete interview session and compute final analytics.
 */
export async function completeInterview(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const interviewId = getInterviewId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!interviewId || !isValidObjectId(interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID" });
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    const evaluated = interview.questions.filter((q) => q.evaluation);
    if (evaluated.length === 0) {
      interview.overallScore = 60;
    } else {
      const avg = evaluated.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0) / evaluated.length;
      interview.overallScore = Math.round(avg);
    }

    // Compute analytics
    let totalWords = 0;
    let totalDuration = 0;
    evaluated.forEach((q) => {
      if (q.answer) {
        totalWords += q.answer.trim().split(/\s+/).length;
      }
      totalDuration += q.audioDurationSeconds || 30;
    });

    const paceWpm = totalDuration > 0 ? Math.round((totalWords / totalDuration) * 60) : 120;

    interview.analytics = {
      totalWords,
      speakingPaceWpm: paceWpm,
      totalDurationSeconds: totalDuration,
      strengths: evaluated.flatMap((q) => q.evaluation?.strengths || []).slice(0, 5),
      improvementSuggestions: evaluated.flatMap((q) => q.evaluation?.suggestions || []).slice(0, 5),
    };

    interview.status = "completed";
    interview.completedAt = new Date();
    await interview.save();

    return res.json({
      success: true,
      message: "Interview completed successfully",
      data: interview,
    });
  } catch (error) {
    console.error("completeInterview error:", error);
    return res.status(500).json({ success: false, message: "Failed to complete interview" });
  }
}

/**
 * GET /api/interview/user/history
 * Fetch all interviews for logged-in user.
 */
export async function getUserInterviews(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const interviews = await Interview.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({ success: true, data: interviews });
  } catch (error) {
    console.error("getUserInterviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch interviews" });
  }
}

/**
 * GET /api/interview/user/analytics
 * Aggregate performance statistics for dashboard charts.
 */
export async function getUserAnalytics(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const interviews = await Interview.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "completed",
    }).sort({ createdAt: 1 });

    const totalSessions = interviews.length;
    const scores = interviews.map((i) => i.overallScore || 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Trend points for AreaChart
    const trend = interviews.slice(-7).map((item, idx) => ({
      d: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { weekday: "short" }) : `S${idx + 1}`,
      s: item.overallScore || 0,
      title: item.title,
    }));

    // Radar chart dimensional breakdown
    let claritySum = 0, relevanceSum = 0, structureSum = 0, confidenceSum = 0, concisenessSum = 0;
    let scoredCount = 0;

    interviews.forEach((item) => {
      if (item.scores) {
        claritySum += item.scores.clarity || 0;
        relevanceSum += item.scores.relevance || 0;
        structureSum += item.scores.structure || 0;
        confidenceSum += item.scores.confidence || 0;
        concisenessSum += item.scores.conciseness || 0;
        scoredCount++;
      }
    });

    const radarData = [
      { subject: "Clarity", score: scoredCount > 0 ? Math.round(claritySum / scoredCount) : 85 },
      { subject: "Relevance", score: scoredCount > 0 ? Math.round(relevanceSum / scoredCount) : 80 },
      { subject: "Confidence", score: scoredCount > 0 ? Math.round(confidenceSum / scoredCount) : 78 },
      { subject: "Structure", score: scoredCount > 0 ? Math.round(structureSum / scoredCount) : 75 },
      { subject: "Conciseness", score: scoredCount > 0 ? Math.round(concisenessSum / scoredCount) : 82 },
    ];

    const totalMinutes = interviews.reduce((sum, item) => sum + (item.analytics?.totalDurationSeconds || 900) / 60, 0);

    return res.json({
      success: true,
      data: {
        averageScore: avgScore,
        completedInterviews: totalSessions,
        totalPracticeMinutes: Math.round(totalMinutes),
        trendData: trend.length > 0 ? trend : [
          { d: "Mon", s: 65 }, { d: "Tue", s: 72 }, { d: "Wed", s: 70 },
          { d: "Thu", s: 78 }, { d: "Fri", s: 82 }, { d: "Sat", s: 85 }, { d: "Sun", s: 88 }
        ],
        radarData,
        recentInterviews: interviews.slice(-5).reverse(),
      },
    });
  } catch (error) {
    console.error("getUserAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
}

/**
 * GET /api/interview/:interviewId
 * Fetch single interview session by ID.
 */
export async function getInterview(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const interviewId = getInterviewId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!isValidObjectId(interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID" });
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    return res.json({ success: true, data: interview });
  } catch (error) {
    console.error("getInterview error:", error);
    return res.status(500).json({ success: false, message: "Failed to get interview" });
  }
}

/**
 * POST /api/interview/test-ai
 * Direct test endpoint for the AI test page.
 */
export async function testAiConnection(req: Request, res: Response) {
  try {
    const { prompt = "Hello AI interviewer, give a short 1-sentence intro." } = req.body;
    const result = await testAiEnginePrompt(prompt);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "AI Engine test failed" });
  }
}