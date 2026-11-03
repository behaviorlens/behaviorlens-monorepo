from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables (or a local .env)."""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="BL_", extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql+psycopg://behaviorlens:behaviorlens@localhost:5432/behaviorlens"
    redis_url: str = "redis://localhost:6379/0"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:5173"]

    # Object storage (S3-compatible) for recorded event chunks.
    s3_endpoint_url: str = "http://localhost:8333"
    s3_bucket: str = "behaviorlens-recordings"
    s3_access_key: str = "behaviorlens"
    s3_secret_key: str = "behaviorlens"
    s3_region: str = "us-east-1"

    # Ingest limits.
    max_batch_bytes: int = 1_048_576  # request body as sent (gzip or plain)
    max_batch_decoded_bytes: int = 8_388_608  # after decompression
    max_session_bytes: int = 52_428_800  # stored (compressed) bytes per session
    rate_limit_per_second: float = 50.0  # per project
    rate_limit_burst: int = 200

    # Sessions close after this long without new events. Keep in step with
    # SESSION_IDLE_MS in the recorder (recorder/src/core/session.js).
    session_idle_seconds: int = 600
    # Replays above this stored size answer 413 instead of loading.
    max_replay_bytes: int = 26_214_400

    # Where the built recorder bundles live, and the URL the browser uses to reach the API.
    recorder_dist_dir: str = "../recorder/dist"
    public_api_url: str = "http://localhost:8000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
