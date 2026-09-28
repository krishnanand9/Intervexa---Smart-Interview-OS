from app.models.interview import EvaluationRequest


async def evaluate_answer(request: EvaluationRequest):

    answer = request.answer.strip()

    word_count = len(answer.split())

    if word_count == 0:
        return {
            "score": 0,
            "clarity": 0,
            "relevance": 0,
            "structure": 0,
            "confidence": 0,
            "conciseness": 0,
            "strengths": [],
            "suggestions": [
                "Please provide an answer."
            ],
            "feedback": "No answer was provided.",
        }

    clarity = min(100, 50 + word_count * 2)
    relevance = min(100, 55 + word_count * 2)
    structure = min(100, 45 + word_count * 2)
    confidence = min(100, 50 + word_count)
    conciseness = max(50, 100 - max(0, word_count - 100))

    score = round(
        (
            clarity
            + relevance
            + structure
            + confidence
            + conciseness
        ) / 5
    )

    strengths = []

    if word_count >= 30:
        strengths.append("You provided enough detail.")

    if word_count >= 60:
        strengths.append("Your answer demonstrates reasonable depth.")

    if not strengths:
        strengths.append(
            "You provided a direct response."
        )

    suggestions = []

    if word_count < 40:
        suggestions.append(
            "Add a specific example to strengthen your answer."
        )

    if word_count > 150:
        suggestions.append(
            "Make the answer more concise."
        )

    suggestions.append(
        "Use a clear beginning, middle, and conclusion."
    )

    return {
        "score": score,
        "clarity": clarity,
        "relevance": relevance,
        "structure": structure,
        "confidence": confidence,
        "conciseness": conciseness,
        "strengths": strengths,
        "suggestions": suggestions,
        "feedback": (
            "Your answer has been evaluated using "
            "InterVexa's interview evaluation engine."
        ),
    }