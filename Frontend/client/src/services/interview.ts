import api from "./api";

export interface GenerateQuestionsRequest {
  interviewType: "technical" | "behavioral" | "hr" | "mixed";
  role: string;
  experienceLevel?: string;
  numberOfQuestions?: number;
}

export interface InterviewQuestionItem {
  questionId: string;
  question: string;
  category?: string;
  difficulty?: string;
  answer?: string;
  answeredAt?: string;
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

export interface ConversationMessage {
  speaker: "ai" | "candidate" | "system";
  text: string;
  timestamp: string;
}

export interface InterviewSession {
  _id: string;
  userId: string;
  title: string;
  role: string;
  interviewType: "technical" | "behavioral" | "hr" | "mixed";
  experienceLevel: string;
  status: "created" | "in_progress" | "completed";
  questions: InterviewQuestionItem[];
  conversationTimeline: ConversationMessage[];
  overallScore?: number;
  scores?: {
    clarity: number;
    relevance: number;
    structure: number;
    confidence: number;
    conciseness: number;
  };
  analytics?: {
    totalWords: number;
    speakingPaceWpm: number;
    totalDurationSeconds: number;
    strengths: string[];
    improvementSuggestions: string[];
  };
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestionIndex: number;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface StartInterviewRequest {
  role: string;
  interviewType: "technical" | "behavioral" | "hr" | "mixed";
  experienceLevel: "fresher" | "junior" | "mid" | "senior";
  numberOfQuestions?: number;
  skillsOrResume?: string;
  jobDescription?: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string;
  audioDurationSeconds?: number;
}

export interface SubmitAnswerResponse {
  success: boolean;
  message: string;
  data: {
    interviewId: string;
    questionId: string;
    evaluation: {
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
    nextQuestion?: string | null;
    nextQuestionId?: string | null;
    isCompleted: boolean;
    overallScore?: number;
    answeredQuestions: number;
    totalQuestions: number;
    currentQuestionIndex: number;
    session: InterviewSession;
  };
}

export interface UserAnalyticsResponse {
  success: boolean;
  data: {
    averageScore: number;
    completedInterviews: number;
    totalPracticeMinutes: number;
    trendData: Array<{ d: string; s: number; title?: string }>;
    radarData: Array<{ subject: string; score: number }>;
    recentInterviews: InterviewSession[];
  };
}

export interface TestAiResponse {
  success: boolean;
  data: {
    success: boolean;
    provider: string;
    model: string;
    response: string;
    latencyMs: number;
  };
}

// APIs
export async function startInterview(data: StartInterviewRequest): Promise<{ success: boolean; data: InterviewSession }> {
  const response = await api.post("/interview/start", data);
  return response.data;
}

export async function submitAnswer(
  interviewId: string,
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  const response = await api.post<SubmitAnswerResponse>(
    `/interview/${interviewId}/answer`,
    data
  );
  return response.data;
}

export async function completeInterview(
  interviewId: string
): Promise<{ success: boolean; data: InterviewSession }> {
  const response = await api.post(`/interview/${interviewId}/complete`);
  return response.data;
}

export async function getInterview(
  interviewId: string
): Promise<{ success: boolean; data: InterviewSession }> {
  const response = await api.get(`/interview/${interviewId}`);
  return response.data;
}

export async function getUserInterviews(): Promise<{ success: boolean; data: InterviewSession[] }> {
  const response = await api.get("/interview/user/history");
  return response.data;
}

export async function getUserAnalytics(): Promise<UserAnalyticsResponse> {
  const response = await api.get<UserAnalyticsResponse>("/interview/user/analytics");
  return response.data;
}

export async function generateQuestions(
  data: GenerateQuestionsRequest
): Promise<{ success: boolean; data: { questions: any[] } }> {
  const response = await api.post("/interview/questions", data);
  return response.data;
}

export async function testAiEngine(prompt: string): Promise<TestAiResponse> {
  const response = await api.post<TestAiResponse>("/interview/test-ai", { prompt });
  return response.data;
}