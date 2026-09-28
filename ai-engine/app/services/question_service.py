from app.models.interview import (
    QuestionRequest,
    QuestionResponse,
    Question,
)


BASE_QUESTIONS = {
    "technical": [
        "Walk me through a technically challenging feature you built.",
        "How would you design a scalable frontend architecture?",
        "How do you diagnose a performance problem in production?",
        "Explain a technical trade-off you made.",
        "How would you test and safely release a major change?",
    ],
    "behavioral": [
        "Tell me about a project you are proud of.",
        "Tell me about a time you disagreed with a teammate.",
        "Describe a difficult deadline and how you handled it.",
        "Tell me about a mistake you made and what you learned.",
        "Describe a situation where you had to influence someone.",
    ],
    "hr": [
        "Tell me about yourself.",
        "Why are you interested in this role?",
        "Why should we hire you?",
        "What are your strengths?",
        "Where do you see yourself in the next few years?",
    ],
}


async def generate_questions(
    request: QuestionRequest,
) -> QuestionResponse:

    interview_type = request.interviewType.lower()

    if interview_type == "mixed":
        questions_text = (
            BASE_QUESTIONS["technical"]
            + BASE_QUESTIONS["behavioral"]
            + BASE_QUESTIONS["hr"]
        )
    else:
        questions_text = BASE_QUESTIONS.get(
            interview_type,
            BASE_QUESTIONS["technical"],
        )

    questions_text = questions_text[
        :request.numberOfQuestions
    ]

    questions = []

    for index, question_text in enumerate(
        questions_text,
        start=1,
    ):
        category = interview_type

        if interview_type == "mixed":
            if index <= 2:
                category = "technical"
            elif index <= 4:
                category = "behavioral"
            else:
                category = "hr"

        questions.append(
            Question(
                id=index,
                question=question_text,
                category=category,
            )
        )

    return QuestionResponse(
        questions=questions
    )