import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.models.schemas import HealthResponse
from app.rate_limit import limiter
from app.routes import analytics, candidates, chat, compare, history, job, resume, screen, settings as settings_routes

logging.basicConfig(level=logging.INFO)

_BACKEND = Path(__file__).resolve().parent.parent
_MOCK_DIR = _BACKEND / "mock_data"
_REPORTS_DIR = _BACKEND / "reports"


def _load_runtime_settings():
    """Load persisted settings (keys, offline mode) into the runtime config."""
    try:
        from app.database import get_settings, init_db

        init_db()
        stored = get_settings()
        if stored.get("geminiApiKey"):
            settings.gemini_api_key = str(stored["geminiApiKey"]).strip()
        if stored.get("openaiApiKey"):
            settings.openai_api_key = str(stored["openaiApiKey"]).strip()
        settings.offline_mode = bool(stored.get("offlineMode"))
    except Exception as exc:  # noqa: BLE001
        logging.getLogger("smart-hire").warning("Could not load persisted settings: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    _load_runtime_settings()
    logger = logging.getLogger("smart-hire")
    logger.info("AI enabled: %s", settings.ai_enabled)
    if settings.openai_api_key:
        logger.info("AI provider: Groq (via OpenAI SDK)")
        logger.info("AI model: %s", settings.openai_model)
        logger.info("Groq base URL: %s", settings.groq_base_url)
    else:
        logger.info("AI provider: None (Offline Heuristic Engine active)")
    logger.info("Smart Hire backend ready.")
    yield



app = FastAPI(
    title="Smart Hire – AI Resume Screening API",
    description="Analyze job descriptions, parse resumes and rank candidates with AI.",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    response = JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )
    response = limiter._inject_headers(response, getattr(request.state, "view_rate_limit", None))
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screen.router)
app.include_router(resume.router)
app.include_router(job.router)
app.include_router(compare.router)
app.include_router(candidates.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(settings_routes.router)

# Serve generated mock assets + reports as static files.
if (_MOCK_DIR / "photos").exists():
    app.mount("/mock/photos", StaticFiles(directory=str(_MOCK_DIR / "photos")), name="mock-photos")
if (_MOCK_DIR / "resumes").exists():
    app.mount("/mock/resumes", StaticFiles(directory=str(_MOCK_DIR / "resumes")), name="mock-resumes")
if _REPORTS_DIR.exists():
    app.mount("/reports", StaticFiles(directory=str(_REPORTS_DIR)), name="reports")


@app.get("/api/health", response_model=HealthResponse)
@limiter.limit(settings.general_rate_limit)
async def health(request: Request) -> HealthResponse:
    provider = "groq" if settings.openai_api_key else "none"
    return HealthResponse(
        status="ok",
        aiProvider=provider,
        aiEnabled=settings.ai_enabled,
    )