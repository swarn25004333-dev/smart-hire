import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

_here = Path(__file__).resolve().parent
_load_dotenv = load_dotenv(dotenv_path=_here.parent / ".env", override=False)
if not _load_dotenv:
    load_dotenv()


class Settings:
    def __init__(self) -> None:
        self._openai_api_key: Optional[str] = None
        self._gemini_api_key: Optional[str] = None
        self._offline_mode: Optional[bool] = None

    @property
    def openai_api_key(self) -> str:
        if self._openai_api_key is not None:
            return self._openai_api_key
        return os.getenv("OPENAI_API_KEY", "").strip()

    @openai_api_key.setter
    def openai_api_key(self, value: str) -> None:
        self._openai_api_key = value.strip() if value else ""

    @openai_api_key.deleter
    def openai_api_key(self) -> None:
        self._openai_api_key = None

    @property
    def gemini_api_key(self) -> str:
        if self._gemini_api_key is not None:
            return self._gemini_api_key
        return os.getenv("GEMINI_API_KEY", "").strip()

    @gemini_api_key.setter
    def gemini_api_key(self, value: str) -> None:
        self._gemini_api_key = value.strip() if value else ""

    @gemini_api_key.deleter
    def gemini_api_key(self) -> None:
        self._gemini_api_key = None

    @property
    def offline_mode(self) -> bool:
        if self._offline_mode is not None:
            return self._offline_mode
        return False

    @offline_mode.setter
    def offline_mode(self, value: bool) -> None:
        self._offline_mode = bool(value)

    @offline_mode.deleter
    def offline_mode(self) -> None:
        self._offline_mode = None


    @property
    def groq_base_url(self) -> str:
        return os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").strip()

    @property
    def openai_model(self) -> str:
        return os.getenv("OPENAI_MODEL", "llama-3.3-70b-versatile").strip()

    @property
    def gemini_model(self) -> str:
        return os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

    @property
    def frontend_origin(self) -> str:
        return os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").strip()

    @property
    def max_upload_size(self) -> int:
        return int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))

    @property
    def ai_timeout_seconds(self) -> float:
        return float(os.getenv("AI_TIMEOUT_SECONDS", "30"))

    @property
    def general_rate_limit(self) -> str:
        return os.getenv("GENERAL_RATE_LIMIT", "60/minute").strip()

    @property
    def ai_screen_rate_limit(self) -> str:
        return os.getenv("AI_SCREEN_RATE_LIMIT", "5/minute").strip()

    @property
    def ai_analyze_job_rate_limit(self) -> str:
        return os.getenv("AI_ANALYZE_JOB_RATE_LIMIT", "10/minute").strip()

    @property
    def resume_parse_rate_limit(self) -> str:
        return os.getenv("RESUME_PARSE_RATE_LIMIT", "20/minute").strip()

    @property
    def compare_rate_limit(self) -> str:
        return os.getenv("COMPARE_RATE_LIMIT", "10/minute").strip()

    @property
    def ai_enabled(self) -> bool:
        if self.offline_mode:
            return False
        return bool(self.openai_api_key or self.gemini_api_key)


settings = Settings()

