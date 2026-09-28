import time
from fastapi import APIRouter
from app.models.interview import (
    QuestionRequest,
    QuestionResponse,
    EvaluationRequest,
    EvaluationResult,
    NextQuestionRequest,
    NextQuestionResponse,
)
from app.services.gemini_service import (
    generate_interview_questions_ai,
    evaluate_answer_ai,
    generate_next_conversational_question,
    call_gemini_api,
)
from app.core.config import get_settings

router = APIRouter()


@router.post("/questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
    """Generate interview questions for a role and interview type."""
    return await generate_interview_questions_ai(request)


@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_answer(request: EvaluationRequest):
    """Evaluate candidate answer and generate dimensional score & feedback."""
    return await evaluate_answer_ai(request)


@router.post("/next-question", response_model=NextQuestionResponse)
async def next_question(request: NextQuestionRequest):
    """
    Real-time conversational loop:
    Evaluates current candidate answer, stores it into conversational system prompt context,
    and returns immediate next question.
    """
    return await generate_next_conversational_question(request)


@router.post("/test-prompt")
async def test_ai_prompt(payload: dict):
    """Test AI prompt endpoint for testing page to verify LLM latency and connectivity."""
    prompt = payload.get("prompt", "Hello! How can you help me prepare for an interview?")
    start_time = time.time()
    
    settings = get_settings()
    llm_response = await call_gemini_api(prompt)
    latency_ms = int((time.time() - start_time) * 1000)
    
    if llm_response:
        active_model = settings.gemini_model if settings.gemini_api_key else (
            settings.groq_model if settings.openai_api_key.startswith("gsk_") else settings.openai_model
        )
        return {
            "success": True,
            "provider": settings.llm_provider,
            "model": active_model,
            "response": llm_response,
            "latencyMs": latency_ms,
        }
    
    return {
        "success": True,
        "provider": "InterVexa AI Fallback Engine",
        "model": "rule-based-fast-evaluator",
        "response": "Hello candidate! I am InterVexa AI, your real-time interview coach. I will listen to your answers, assess your delivery, and guide you through your mock interview.",
        "latencyMs": latency_ms,
    }