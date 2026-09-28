import json
import logging
from typing import Any, List, Optional
import httpx
from app.core.config import get_settings
from app.models.interview import (
    QuestionRequest,
    QuestionResponse,
    Question,
    EvaluationRequest,
    EvaluationResult,
    NextQuestionRequest,
    NextQuestionResponse,
    ConversationTurn,
)

logger = logging.getLogger("ai_engine.gemini")


def get_fallback_questions(request: QuestionRequest) -> List[Question]:
    """Generates structured questions based on role and interview type."""
    role = request.role
    q_type = request.interviewType.lower()
    
    technical_bank = [
        f"Walk me through a technically challenging feature you recently designed or built as a {role}.",
        f"How do you ensure reliability, error handling, and performance optimization in your {role} stack?",
        f"Explain a difficult architectural trade-off or technical debt decision you made in a past project.",
        f"How do you approach debugging high-priority production incidents under tight deadlines?",
        f"How do you structure code to make it maintainable, modular, and easy for other engineers to test?",
    ]
    
    behavioral_bank = [
        "Tell me about a high-pressure situation where requirements shifted drastically and how you adapted.",
        "Describe a time you had a technical disagreement with a colleague or manager and how you resolved it.",
        "Tell me about a project that did not go according to plan. What was the root cause and what did you learn?",
        "How do you prioritize competing deadlines when multiple stakeholders urgently need deliverables?",
        "Describe a situation where you took the initiative to improve a broken workflow or process.",
    ]
    
    hr_bank = [
        f"Why are you interested in pursuing this {role} position with us specifically?",
        "What work environment and team culture allow you to perform at your highest potential?",
        "What are your core professional strengths, and what is one area you are currently striving to improve?",
        "Where do you see yourself developing technically and professionally over the next 2-3 years?",
        "Why should our team choose you over other qualified candidates for this role?",
    ]
    
    selected_texts = []
    categories = []
    
    if q_type == "technical":
        selected_texts = technical_bank
        categories = ["technical"] * len(technical_bank)
    elif q_type == "behavioral":
        selected_texts = behavioral_bank
        categories = ["behavioral"] * len(behavioral_bank)
    elif q_type == "hr":
        selected_texts = hr_bank
        categories = ["hr"] * len(hr_bank)
    else:  # mixed
        selected_texts = [
            technical_bank[0],
            technical_bank[1],
            behavioral_bank[0],
            behavioral_bank[1],
            hr_bank[0],
        ]
        categories = ["technical", "technical", "behavioral", "behavioral", "hr"]
    
    total = min(request.numberOfQuestions, len(selected_texts))
    questions: List[Question] = []
    for i in range(total):
        questions.append(
            Question(
                id=i + 1,
                question=selected_texts[i],
                category=categories[i] if i < len(categories) else "general",
                difficulty=request.experienceLevel or "medium",
            )
        )
    return questions


def heuristic_evaluate_answer(
    question: str,
    answer: str,
    role: str = "Candidate",
    interview_type: str = "mixed",
) -> EvaluationResult:
    """Smart heuristic evaluator when LLM is unavailable or offline."""
    clean_ans = answer.strip()
    words = clean_ans.split()
    word_count = len(words)
    
    if word_count == 0:
        return EvaluationResult(
            score=0,
            clarity=0,
            relevance=0,
            structure=0,
            confidence=0,
            conciseness=0,
            strengths=[],
            suggestions=["Please provide an audible or written answer."],
            feedback="No answer was detected. Please formulate a response to demonstrate your knowledge.",
        )
    
    # Calculate dimensional scores
    clarity = min(96, max(45, 55 + min(35, int(word_count * 0.7))))
    relevance = min(95, max(50, 60 + min(30, int(word_count * 0.6))))
    structure = min(94, max(40, 50 + min(40, int(word_count * 0.8))))
    confidence = min(95, max(50, 62 + min(30, int(word_count * 0.5))))
    
    # Conciseness penalty if excessively long
    if word_count > 160:
        conciseness = max(55, 95 - int((word_count - 160) * 0.5))
    else:
        conciseness = min(95, max(60, 75 + min(20, int(word_count * 0.3))))
        
    overall = int(round((clarity + relevance + structure + confidence + conciseness) / 5))
    
    strengths = []
    if word_count >= 35:
        strengths.append("Provided a substantive response with relevant context.")
    if word_count >= 70:
        strengths.append("Demonstrated good technical depth and problem-solving explanation.")
    if not strengths:
        strengths.append("Addressed the question directly.")
        
    suggestions = []
    if word_count < 45:
        suggestions.append("Elaborate further using the STAR method (Situation, Task, Action, Result).")
    if word_count > 180:
        suggestions.append("Keep the explanation slightly more concise to highlight key impacts quickly.")
    suggestions.append("Quantify outcomes with concrete metrics or tangible deliverables.")
    
    feedback = (
        f"Solid answer for {role}. Your response communicates key points well. "
        "To elevate it to top-tier, weave in quantifiable outcomes and emphasize specific architectural or leadership decisions."
    )
    
    return EvaluationResult(
        score=overall,
        clarity=clarity,
        relevance=relevance,
        structure=structure,
        confidence=confidence,
        conciseness=conciseness,
        strengths=strengths,
        suggestions=suggestions,
        feedback=feedback,
    )


async def call_gemini_api(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Call LLM API flexibly via Gemini, Groq, or OpenAI compatibility."""
    settings = get_settings()
    api_key = settings.gemini_api_key

    # Attempt 1 & 2: If Gemini API key is configured, use Gemini
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config={
                    "system_instruction": system_instruction or "You are an expert AI interviewer and evaluator.",
                    "response_mime_type": "application/json",
                }
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"google-genai client attempt failed: {e}. Trying REST endpoint...")

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.4
                }
            }
            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return text
                else:
                    logger.warning(f"Gemini REST returned {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Gemini REST attempt failed: {e}")

    # Attempt 3: Groq or OpenAI API
    if settings.openai_api_key:
        try:
            from openai import AsyncOpenAI

            is_groq = settings.openai_api_key.startswith("gsk_")
            if is_groq:
                ai_client = AsyncOpenAI(
                    api_key=settings.openai_api_key,
                    base_url="https://api.groq.com/openai/v1"
                )
                models_to_try = [
                    settings.groq_model,
                    "openai/gpt-oss-120b",
                    "openai/gpt-oss-20b",
                    "qwen/qwen3.8-27b",
                    "llama-3.3-70b-versatile"
                ]
            else:
                ai_client = AsyncOpenAI(api_key=settings.openai_api_key)
                models_to_try = [settings.openai_model, "gpt-4o-mini"]

            for model_to_use in models_to_try:
                try:
                    completion = await ai_client.chat.completions.create(
                        model=model_to_use,
                        messages=[
                            {"role": "system", "content": system_instruction or "You are an expert AI interviewer. Always respond with valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                    )
                    content = completion.choices[0].message.content
                    if content and content.strip():
                        return content
                except Exception as model_err:
                    logger.warning(f"Model {model_to_use} attempt failed: {model_err}")
                    continue
        except Exception as e:
            logger.error(f"OpenAI/Groq client error: {e}")

    return None


async def generate_interview_questions_ai(request: QuestionRequest) -> QuestionResponse:
    """Generate dynamic questions for role and interview type via Gemini / Groq."""
    skills_ctx = f"\nCandidate Skills / Stack: {request.skillsOrResume}" if request.skillsOrResume else ""
    jd_ctx = f"\nTarget Job Description: {request.jobDescription}" if request.jobDescription else ""
    
    prompt = f"""Generate {request.numberOfQuestions} realistic, insightful interview questions for a {request.experienceLevel or 'mid'}-level {request.role}.
Interview Type: {request.interviewType}.{skills_ctx}{jd_ctx}
Focus on evaluating core competencies, architecture trade-offs, practical problem solving, and realistic engineering scenarios.
Format requirement: Return ONLY valid JSON with this exact schema:
{{
  "questions": [
    {{
      "id": 1,
      "question": "The question text here...",
      "category": "technical|behavioral|hr",
      "difficulty": "junior|mid|senior"
    }}
  ]
}}"""
    system_instruction = (
        f"You are a Senior Principal Interviewer assessing candidates for {request.role}. "
        "Formulate professional, highly relevant interview questions tailored to their skills and background."
    )
    
    raw_json = await call_gemini_api(prompt, system_instruction)
    if raw_json:
        try:
            # Clean markdown codeblocks if present
            cleaned = raw_json.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            data = json.loads(cleaned)
            questions_list = []
            for item in data.get("questions", []):
                questions_list.append(
                    Question(
                        id=int(item.get("id", len(questions_list) + 1)),
                        question=str(item.get("question")),
                        category=str(item.get("category", request.interviewType)),
                        difficulty=str(item.get("difficulty", request.experienceLevel or "mid")),
                    )
                )
            if questions_list:
                return QuestionResponse(questions=questions_list)
        except Exception as e:
            logger.warning(f"Error parsing Gemini questions JSON: {e}")

    # Fallback to rich curated questions bank
    return QuestionResponse(questions=get_fallback_questions(request))


async def evaluate_answer_ai(request: EvaluationRequest) -> EvaluationResult:
    """Evaluate candidate answer using Gemini or smart fallback."""
    if not request.answer or not request.answer.strip():
        return heuristic_evaluate_answer(
            request.question,
            "",
            request.role or "Candidate",
            request.interviewType or "mixed",
        )

    prompt = f"""Evaluate this candidate's interview response objectively.
Role: {request.role or 'Software Engineer'}
Interview Type: {request.interviewType or 'mixed'}
Question: {request.question}
Candidate's Answer: {request.answer}

Return ONLY valid JSON matching this schema:
{{
  "score": 0-100,
  "clarity": 0-100,
  "relevance": 0-100,
  "structure": 0-100,
  "confidence": 0-100,
  "conciseness": 0-100,
  "strengths": ["Key strength 1", "Key strength 2"],
  "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"],
  "feedback": "2-3 sentences of actionable, constructive coaching feedback."
}}"""

    system_instruction = (
        "You are an expert AI interview evaluator and coach. "
        "Score objectively on clarity, technical or behavioral relevance, structure, and conciseness. "
        "Provide constructive feedback."
    )

    raw_json = await call_gemini_api(prompt, system_instruction)
    if raw_json:
        try:
            cleaned = raw_json.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            data = json.loads(cleaned)
            return EvaluationResult(
                score=int(data.get("score", 75)),
                clarity=int(data.get("clarity", 75)),
                relevance=int(data.get("relevance", 75)),
                structure=int(data.get("structure", 70)),
                confidence=int(data.get("confidence", 75)),
                conciseness=int(data.get("conciseness", 75)),
                strengths=[str(s) for s in data.get("strengths", ["Answer addressed the prompt."])],
                suggestions=[str(s) for s in data.get("suggestions", ["Add more concrete examples."])],
                feedback=str(data.get("feedback", "Good effort answering the question.")),
            )
        except Exception as e:
            logger.warning(f"Error parsing Gemini evaluation JSON: {e}")

    # Fallback heuristic evaluation
    return heuristic_evaluate_answer(
        request.question,
        request.answer,
        request.role or "Software Engineer",
        request.interviewType or "mixed",
    )


async def generate_next_conversational_question(request: NextQuestionRequest) -> NextQuestionResponse:
    """
    Real-time dynamic conversational AI:
    1. Evaluates candidate's latest spoken answer.
    2. Stores candidate's answer into the conversational system prompt context.
    3. Generates the immediate next question or intelligent follow-up.
    """
    eval_req = EvaluationRequest(
        question=request.currentQuestion,
        answer=request.candidateAnswer,
        interviewType=request.interviewType,
        role=request.role,
        experienceLevel=request.experienceLevel,
    )
    evaluation = await evaluate_answer_ai(eval_req)
    
    # Check if we have reached the end of the interview
    is_completed = request.questionIndex >= request.totalQuestions
    
    # Build updated conversational context
    history_summary = []
    for turn in request.conversationHistory:
        history_summary.append(f"{turn.role.upper()}: {turn.content}")
    history_summary.append(f"AI: {request.currentQuestion}")
    history_summary.append(f"CANDIDATE: {request.candidateAnswer}")
    
    context_str = "\n".join(history_summary)
    
    if is_completed:
        return NextQuestionResponse(
            nextQuestion=None,
            category="completed",
            isCompleted=True,
            evaluation=evaluation,
            systemPromptContext=context_str,
        )

    # Prompt LLM to synthesize the next logical question / follow-up
    prompt = f"""You are conducting a live interview with a candidate for {request.role} ({request.experienceLevel}).
Interview Type: {request.interviewType}.
Question #{request.questionIndex} of {request.totalQuestions}.

Conversation so far:
{context_str}

Candidate just finished speaking their answer.
Now formulate Question #{request.questionIndex + 1}.
Requirements:
1. Make it natural and conversational.
2. If relevant, briefly acknowledge their previous response before posing the question, or smoothly transition to the next topic.
3. Keep it clear, concise, and focused so candidate can answer directly.

Return ONLY valid JSON matching this schema:
{{
  "nextQuestion": "The spoken question text that the AI interviewer will speak to the candidate...",
  "category": "technical|behavioral|hr"
}}"""

    system_instruction = (
        f"You are InterVexa's real-time AI Interviewer. You listen to the candidate's answers, "
        "update your internal evaluation, and immediately ask the next question in a natural spoken tone."
    )

    next_q_text = None
    next_cat = request.interviewType
    
    raw_json = await call_gemini_api(prompt, system_instruction)
    if raw_json:
        try:
            cleaned = raw_json.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            next_q_text = data.get("nextQuestion")
            next_cat = data.get("category", request.interviewType)
        except Exception as e:
            logger.warning(f"Error parsing next question JSON: {e}")

    # Fallback next question if LLM failed
    if not next_q_text:
        fallback_req = QuestionRequest(
            interviewType=request.interviewType,
            role=request.role,
            experienceLevel=request.experienceLevel,
            numberOfQuestions=request.totalQuestions,
        )
        fb_questions = get_fallback_questions(fallback_req)
        idx = min(request.questionIndex, len(fb_questions) - 1)
        next_q_text = fb_questions[idx].question
        next_cat = fb_questions[idx].category

    return NextQuestionResponse(
        nextQuestion=next_q_text,
        category=next_cat,
        isCompleted=False,
        evaluation=evaluation,
        systemPromptContext=context_str,
    )
