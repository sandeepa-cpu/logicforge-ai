"""Pydantic request and response models for the LogicForge API."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ExpressionRequest(BaseModel):
    expression: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        examples=["(A AND B) OR (NOT A AND C)"],
    )


class TruthTableModel(BaseModel):
    variables: list[str]
    headers: list[str]
    matrix: list[list[int]]
    rows: list[dict[str, int]]


class SimplificationStepModel(BaseModel):
    title: str
    expression: str
    latex: str


class ASTInputPin(BaseModel):
    id: str
    label: str
    type: str = "input"


class ASTGate(BaseModel):
    id: str
    type: str
    inputs: list[str]
    value: int | None = None


class ASTOutput(BaseModel):
    id: str
    label: str
    type: str = "output"


class ASTConnection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_id: str = Field(alias="from")
    to_id: str = Field(alias="to")
    to_pin: int = 0


class OperationTreeNode(BaseModel):
    type: str
    name: str | None = None
    value: int | None = None
    children: list[OperationTreeNode] = Field(default_factory=list)


class ASTModel(BaseModel):
    inputs: list[ASTInputPin]
    gates: list[ASTGate]
    output: ASTOutput
    connections: list[ASTConnection]
    tree: OperationTreeNode


class AnalyzeResponse(BaseModel):
    raw: str
    standardized: str
    variables: list[str]
    simplified: str
    simplification_steps: list[SimplificationStepModel]
    truth_table: TruthTableModel
    ast: ASTModel


class ParseExpressionResponse(BaseModel):
    variables: list[str]
    truth_table: TruthTableModel
    simplified_expression: str
    simplification_steps: list[SimplificationStepModel]
    ast: ASTModel


class HealthResponse(BaseModel):
    status: str
    service: str = "logicforge-backend"
