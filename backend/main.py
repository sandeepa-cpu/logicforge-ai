"""FastAPI entry point for the LogicForge Boolean analysis backend."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from logic_engine import LogicEngine, LogicEngineError
from models import (
    AnalyzeResponse,
    ExpressionRequest,
    HealthResponse,
    ParseExpressionResponse,
)

app = FastAPI(title="LogicForge AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def _logic_engine(expression: str) -> LogicEngine:
    try:
        return LogicEngine(expression)
    except LogicEngineError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/api/parse-expression", response_model=ParseExpressionResponse)
def parse_expression(payload: ExpressionRequest) -> ParseExpressionResponse:
    engine = _logic_engine(payload.expression)
    return ParseExpressionResponse.model_validate(engine.parse_expression())


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: ExpressionRequest) -> AnalyzeResponse:
    engine = _logic_engine(payload.expression)
    return AnalyzeResponse.model_validate(engine.analyze())
