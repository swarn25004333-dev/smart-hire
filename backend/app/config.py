import os
from pathlib import Path

from dotenv import load_dotenv

_here = Path(__file__).resolve().parent
_load_dotenv = load_dotenv(
    dotenv_path=_here.parent / ".env",
    override=False,
)
if not _load_dotenv:
    load_dotenv()


class Settings:
    # Legacy Gemini fields kept only for the settings-API compatibility;
    # they are no longer used by the AI client (Groq is used instead).
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

    # Groq is called through the existing OpenAI SDK (OpenAI-compatible API).
    # The Groq API key lives in OPENAI_API_KEY; the model defaults to a Groq model.
    groq_base_url: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").strip()
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
    openai_model: str = os.getenv("OPENAI_MODEL", "llama-3.3-70b-versatile").strip()

    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").strip()
    max_upload_size: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))
    ai_timeout_seconds: float = float(os.getenv("AI_TIMEOUT_SECONDS", "30"))

    # Rate limits (per client IP), using the SlowAPI "N/minute" syntax.
    general_rate_limit: str = os.getenv("GENERAL_RATE_LIMIT", "60/minute").strip()
    ai_screen_rate_limit: str = os.getenv("AI_SCREEN_RATE_LIMIT", "5/minute").strip()
    ai_analyze_job_rate_limit: str = os.getenv(
        "AI_ANALYZE_JOB_RATE_LIMIT", "10/minute"
    ).strip()
    resume_parse_rate_limit: str = os.getenv("RESUME_PARSE_RATE_LIMIT", "20/minute").strip()
    compare_rate_limit: str = os.getenv("COMPARE_RATE_LIMIT", "10/minute").strip()

    @property
    def ai_enabled(self) -> bool:
        if getattr(self, "offline_mode", False):
            return False
        return bool(self.gemini_api_key or self.openai_api_key)


settings = Settings()
