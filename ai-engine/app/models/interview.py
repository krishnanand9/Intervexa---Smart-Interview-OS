from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    interviewType: str = "mixed"
    role: str = "Software Engineer"
    experienceLevel: Optional[str] = "mid"
    numberOfQuestions: int = Field(default=5, ge=1, le=20)
    skillsOrResume: Optional[str] = None
    jobDescription: Optional[str] = None


class Question(BaseModel):
    id: int
    question: str
    category: str = "general"
    difficulty: Optional[str] = "medium"


class QuestionResponse(BaseModel):
    questions: List[Question]


class EvaluationRequest(BaseModel):
    question: str
    answer: str
    interviewType: Optional[str] = "mixed"
    role: Optional[str] = "Software Engineer"
    experienceLevel: Optional[str] = "mid"


class EvaluationResult(BaseModel):
    score: int
    clarity: int
    relevance: int
    structure: int
    confidence: int
    conciseness: int
    strengths: List[str] = []
    suggestions: List[str] = []
    feedback: str


class ConversationTurn(BaseModel):
    role: str  # "assistant" or "user"
    content: str
    category: Optional[str] = None


class NextQuestionRequest(BaseModel):
    role: str = "Software Engineer"
    interviewType: str = "mixed"
    experienceLevel: str = "mid"
    currentQuestion: str
    candidateAnswer: str
    questionIndex: int = 1
    totalQuestions: int = 5
    conversationHistory: List[ConversationTurn] = []
    systemPrompt: Optional[str] = None


class NextQuestionResponse(BaseModel):
    nextQuestion: Optional[str] = None
    category: str = "general"
    isCompleted: bool = False
    evaluation: EvaluationResult
    systemPromptContext: str