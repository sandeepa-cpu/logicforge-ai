"use client";

import { useState } from "react";

import AIExplanation from "@/components/AIExplanation";
import CircuitDiagramLoader from "@/components/CircuitDiagramLoader";
import ExpressionInput from "@/components/ExpressionInput";
import KMapGrid from "@/components/KMapGrid";
import TruthTable from "@/components/TruthTable";
import type { CircuitAST } from "@/components/circuit/types";
import type { ParseResult } from "@/lib/parse-types";
import type { SimplificationStep, TruthTableData } from "@/components/truth-table/types";
import { CIRCUIT_PRESETS } from "@/lib/circuit-presets";
import "./Workspace.css";

const DEFAULT_EXPRESSION = "(A AND B) OR (NOT A AND C)";

const DEFAULT_AST: CircuitAST = {
  inputs: [
    { id: "pin_A", label: "A", type: "input" },
    { id: "pin_B", label: "B", type: "input" },
    { id: "pin_C", label: "C", type: "input" },
  ],
  gates: [
    { id: "gate_1", type: "AND", inputs: ["pin_A", "pin_B"] },
    { id: "gate_2", type: "NOT", inputs: ["pin_A"] },
    { id: "gate_3", type: "AND", inputs: ["pin_C", "gate_2"] },
    { id: "gate_4", type: "OR", inputs: ["gate_1", "gate_3"] },
  ],
  output: { id: "out_F", label: "F", type: "output" },
  connections: [
    { from: "pin_A", to: "gate_1", to_pin: 0 },
    { from: "pin_B", to: "gate_1", to_pin: 1 },
    { from: "pin_A", to: "gate_2", to_pin: 0 },
    { from: "pin_C", to: "gate_3", to_pin: 0 },
    { from: "gate_2", to: "gate_3", to_pin: 1 },
    { from: "gate_1", to: "gate_4", to_pin: 0 },
    { from: "gate_3", to: "gate_4", to_pin: 1 },
    { from: "gate_4", to: "out_F", to_pin: 0 },
  ],
};

const DEFAULT_TABLE: TruthTableData = {
  variables: ["A", "B", "C"],
  headers: ["A", "B", "C", "output"],
  matrix: [
    [0, 0, 0, 0],
    [0, 0, 1, 1],
    [0, 1, 0, 0],
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 1, 0],
    [1, 1, 0, 1],
    [1, 1, 1, 1],
  ],
};

const DEFAULT_STEPS: SimplificationStep[] = [
  {
    title: "Original expression",
    expression: DEFAULT_EXPRESSION,
    latex: String.raw`(A \land B) \lor (\neg A \land C)`,
  },
  {
    title: "Minimal sum of products",
    expression: "(A & B) | (C & ~A)",
    latex: String.raw`(A \land B) \lor (C \land \neg A)`,
  },
];

export default function LogicWorkspace() {
  const [draft, setDraft] = useState(DEFAULT_EXPRESSION);
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION);
  const [simplified, setSimplified] = useState("(A & B) | (C & ~A)");
  const [ast, setAst] = useState<CircuitAST>(DEFAULT_AST);
  const [truthTable, setTruthTable] = useState<TruthTableData>(DEFAULT_TABLE);
  const [steps, setSteps] = useState<SimplificationStep[]>(DEFAULT_STEPS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [circuitPreset, setCircuitPreset] = useState("");

  async function parseExpression(nextExpression: string) {
    if (!nextExpression) {
      setError("Expression cannot be empty.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: nextExpression }),
      });
      const payload = (await response.json()) as ParseResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not parse the expression.");
      }

      setDraft(nextExpression);
      setExpression(nextExpression);
      setSimplified(payload.simplified_expression);
      setAst(payload.ast);
      setTruthTable(payload.truth_table);
      setSteps(payload.simplification_steps ?? []);
      setCircuitPreset(
        CIRCUIT_PRESETS.find((preset) => preset.expression === nextExpression)?.id ?? "",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not parse the expression.");
    } finally {
      setBusy(false);
    }
  }

  function exportStudentNote() {
    const previousTitle = document.title;
    const slug = expression.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "note";
    document.title = `LogicForge-AL-${slug}`;
    window.dispatchEvent(new Event("logicforge:fit-diagram"));
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <div className="workspace">
      <header className="workspace-chrome no-print" aria-label="Expression and presets">
        <div className="workspace-chrome__row max-md:flex-col max-md:items-stretch">
          <p className="workspace-chrome__kicker">Logic studio</p>
          <div className="workspace-chrome__actions max-md:w-full max-md:flex-col md:flex-row">
            <label className="circuit-preset max-md:w-full">
              <span>Preset</span>
              <select
                className="max-md:min-h-12 max-md:w-full max-md:max-w-none max-md:px-4 max-md:py-3"
                value={circuitPreset}
                disabled={busy}
                aria-label="Load a standard circuit"
                onChange={(event) => {
                  const selected = CIRCUIT_PRESETS.find((preset) => preset.id === event.target.value);
                  setCircuitPreset(event.target.value);
                  if (selected) {
                    void parseExpression(selected.expression);
                  }
                }}
              >
                <option value="">Standard circuits…</option>
                {CIRCUIT_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} title={preset.note}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="workspace-chrome__export max-md:min-h-12 max-md:w-full max-md:px-4 max-md:py-3"
              onClick={exportStudentNote}
            >
              Export PDF Note
            </button>
          </div>
        </div>
        <ExpressionInput
          value={draft}
          busy={busy}
          error={error}
          onChange={setDraft}
          onSubmitExpression={parseExpression}
        />
      </header>
      <div className="workspace-flow">
        <header className="student-note__cover">
          <p>LogicForge AI — A/L ICT note</p>
          <h2>{expression}</h2>
          {simplified ? <p>Simplified: {simplified}</p> : null}
        </header>
        <figure className="flow-card workspace-diagram" id="circuit-canvas" aria-busy={busy}>
          <figcaption>
            Circuit for <code>{expression}</code>
            {simplified ? (
              <>
                {" "}
                → <code>{simplified}</code>
              </>
            ) : null}
          </figcaption>
          <div className="diagram-frame overflow-x-auto overscroll-x-contain">
            <CircuitDiagramLoader ast={ast} />
          </div>
        </figure>
        <TruthTable
          truthTable={truthTable}
          simplifiedExpression={simplified}
          simplificationSteps={steps}
        />
        <KMapGrid truthTable={truthTable} />
        <AIExplanation
          expression={expression}
          simplifiedExpression={simplified}
          truthTable={truthTable}
        />
      </div>
    </div>
  );
}
