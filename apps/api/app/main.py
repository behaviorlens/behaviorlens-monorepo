from pathlib import Path
from typing import Literal

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from app import ingest, sessions_api
from app.config import get_settings
from app.db import database_is_reachable
from app.logging_config import configure_logging

RECORDER_FILES = {"bl.js", "bl.js.map", "bl-agent.js", "bl-agent.js.map"}


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    database: Literal["ok", "unreachable"]
    environment: str


def health() -> HealthResponse:
    database_ok = database_is_reachable()
    return HealthResponse(
        status="ok" if database_ok else "degraded",
        database="ok" if database_ok else "unreachable",
        environment=get_settings().environment,
    )


def recorder_file(name: str) -> FileResponse:
    """Serves the built recorder bundles (packages/recorder/dist) to customer sites."""
    if name not in RECORDER_FILES:
        raise HTTPException(status_code=404, detail="Not found")
    path = Path(get_settings().recorder_dist_dir) / name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Recorder bundle not built")
    return FileResponse(
        path,
        media_type="application/json" if name.endswith(".map") else "text/javascript",
        headers={"Cache-Control": "no-cache", "Cross-Origin-Resource-Policy": "cross-origin"},
    )


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title="BehaviorLens API", version="0.2.0")
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    # Recorders run on any customer site. Answer their CORS preflights here;
    # the ingest endpoint itself checks the project's allowed origins.
    @app.middleware("http")
    async def ingest_cors(request: Request, call_next):
        if not request.url.path.startswith("/ingest/"):
            return await call_next(request)
        origin = request.headers.get("origin")
        cors = {
            "Access-Control-Allow-Origin": origin or "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Content-Encoding, X-BL-Project-Key",
            "Access-Control-Max-Age": "600",
            "Vary": "Origin",
        }
        if request.method == "OPTIONS":
            return Response(status_code=204, headers=cors)
        response = await call_next(request)
        response.headers.update(cors)
        return response

    # /health for infrastructure checks; /api/v1 is what the dashboard calls.
    app.add_api_route(
        "/health", health, methods=["GET"], response_model=HealthResponse, tags=["health"]
    )
    app.add_api_route("/recorder/{name}", recorder_file, methods=["GET"], include_in_schema=False)
    api = APIRouter(prefix="/api/v1")
    api.add_api_route(
        "/health",
        health,
        methods=["GET"],
        response_model=HealthResponse,
        tags=["health"],
        operation_id="getHealth",
    )
    app.include_router(api)
    app.include_router(sessions_api.router)
    app.include_router(ingest.router)
    return app


app = create_app()
