import mongoose, { Document, Schema } from "mongoose";

export type InterviewType =
  | "technical"
  | "behavioral"
  | "hr"
  | "mixed";

export type ExperienceLevel =
  | "fresher"
  | "junior"
  | "mid"
  | "senior";

export type InterviewStatus =
  | "created"
  | "in_progress"
  | "completed";

export interface IInterviewQuestion {
  questionId: string;
  question: string;
  category?: string;
  difficulty?: string;
  answer?: string;
  answeredAt?: Date;
  audioDurationSeconds?: number;
  evaluation?: {
    score: number;
    clarity: number;
    relevance: number;
    structure: number;
    confidence: number;
    conciseness: number;
    strengths: string[];
    suggestions: string[];
    feedback: string;
  };
}

export interface IConversationMessage {
  speaker: "ai" | "candidate" | "system";
  text: string;
  timestamp: Date;
  audioDurationSeconds?: number;
}

export interface IInterviewScores {
  clarity: number;
  relevance: number;
  structure: number;
  confidence: number;
  conciseness: number;
}

export interface IInterviewAnalytics {
  totalWords: number;
  speakingPaceWpm: number;
  totalDurationSeconds: number;
  strengths: string[];
  improvementSuggestions: string[];
}

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  role: string;
  interviewType: InterviewType;
  experienceLevel: ExperienceLevel;
  status: InterviewStatus;
  questions: IInterviewQuestion[];
  conversationTimeline: IConversationMessage[];
  overallScore?: number;
  scores?: IInterviewScores;
  analytics?: IInterviewAnalytics;
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestionIndex: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationSchema = new Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    clarity: { type: Number, min: 0, max: 100 },
    relevance: { type: Number, min: 0, max: 100 },
    structure: { type: Number, min: 0, max: 100 },
    confidence: { type: Number, min: 0, max: 100 },
    conciseness: { type: Number, min: 0, max: 100 },
    strengths: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    feedback: { type: String, default: "" },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    category: { type: String, default: "general" },
    difficulty: { type: String, default: "mid" },
    answer: { type: String, default: "" },
    answeredAt: { type: Date },
    audioDurationSeconds: { type: Number, default: 0 },
    evaluation: { type: evaluationSchema },
  },
  { _id: false }
);

const conversationMessageSchema = new Schema(
  {
    speaker: {
      type: String,
      enum: ["ai", "candidate", "system"],
      required: true,
    },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    audioDurationSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const interviewSchema = new Schema<IInterview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "AI Interview Session",
      trim: true,
    },
    role: {
      type: String,
      default: "Software Engineer",
      trim: true,
    },
    interviewType: {
      type: String,
      enum: ["technical", "behavioral", "hr", "mixed"],
      default: "mixed",
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ["fresher", "junior", "mid", "senior"],
      default: "mid",
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "in_progress", "completed"],
      default: "created",
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    conversationTimeline: {
      type: [conversationMessageSchema],
      default: [],
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    scores: {
      clarity: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      conciseness: { type: Number, default: 0 },
    },
    analytics: {
      totalWords: { type: Number, default: 0 },
      speakingPaceWpm: { type: Number, default: 0 },
      totalDurationSeconds: { type: Number, default: 0 },
      strengths: { type: [String], default: [] },
      improvementSuggestions: { type: [String], default: [] },
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    answeredQuestions: {
      type: Number,
      default: 0,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInterview>("Interview", interviewSchema);