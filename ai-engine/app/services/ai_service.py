import json
from typing import Any

from app.core.config import get_settings
from app.models.interview import EvaluateRequest


async def generate_ai_feedback(request: EvaluateRequest) -> dict[str, Any] | None:
    settings = get_settings()

    if not settings.openai_api_key:
        return None

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)

        response = await client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an interview coach. Evaluate the candidate's "
                        "answer objectively. Return JSON with keys: overall_score "
                        "(integer 0-100), clarity, relevance, structure, "
                        "confidence, conciseness (each integer 0-100), strengths "
                        "(array of strings), improvements (array of strings), "
                        "feedback (string). Do not speculate about protected "
                        "traits or health."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "role": request.role,
                            "interview_type": request.interview_type,
                            "question": request.question,
                            "answer": request.answer,
                        }
                    ),
                },
            ],
        )

        content = response.choices[0].message.content

        if not content:
            return None

        return json.loads(content)

    except Exception:
        # The local evaluator remains available if the external AI provider
        # is unavailable or misconfigured.
        return None
