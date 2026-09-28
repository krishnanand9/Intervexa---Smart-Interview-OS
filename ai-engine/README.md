# InterVexa — Part 3: FastAPI AI Engine

This part adds the Python FastAPI AI service used by the InterVexa interview platform.

## Features

- FastAPI service
- Health endpoint
- Interview question generation endpoint
- Answer evaluation endpoint
- Structured communication scoring
- Feedback generation
- CORS configuration
- Pydantic validation
- Optional OpenAI integration
- Safe local fallback when no AI API key is configured

## Requirements

- Python 3.10+
- InterVexa Backend from Part 1
- Frontend from Part 2

## Windows setup

From the `ai-engine` folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Open:

http://localhost:8000/docs

Health:

http://localhost:8000/api/health

## Environment

```env
AI_ENGINE_PORT=8000
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

The service works without an OpenAI key using the deterministic local evaluator. Add an API key only when you want live LLM-generated questions and feedback.

## API

### POST /api/interview/questions

Request:

```json
{
  "role": "Frontend Engineer",
  "experience": "Mid-level",
  "interview_type": "technical",
  "count": 5
}
```

### POST /api/interview/evaluate

Request:

```json
{
  "question": "Tell me about a difficult project.",
  "answer": "I led a migration...",
  "role": "Frontend Engineer",
  "interview_type": "behavioral"
}
```

### POST /api/interview/feedback

Request:

```json
{
  "question": "Why should we hire you?",
  "answer": "I have strong React experience...",
  "role": "Frontend Engineer"
}
```
