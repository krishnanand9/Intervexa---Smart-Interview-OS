from fastapi import APIRouter
from app.core.config import get_settings

router = APIRouter()


@router.get("/health")
async def health():
    settings = get_settings()
    has_gemini = bool(settings.gemini_api_key)
    has_openai = bool(settings.openai_api_key)
    
    return {
        "success": True,
        "service": "intervexa-ai-engine",
        "status": "healthy",
        "llm_provider": settings.llm_provider,
        "gemini_configured": has_gemini,
        "gemini_model": settings.gemini_model,
        "openai_configured": has_openai,
    }
