from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.interview import router as interview_router

app = FastAPI(
    title="InterVexa AI Engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    health_router,
    prefix="/api",
)

app.include_router(
    interview_router,
    prefix="/api/interview",
)


@app.get("/")
async def root():
    return {
        "success": True,
        "service": "intervexa-ai-engine",
    }