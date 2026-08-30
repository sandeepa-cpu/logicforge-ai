"use client";

import { useId, useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

import type { SimplificationStep, TruthTableData, ValueFormat } from "./truth-table/types";
import "./TruthTable.css";

export type { SimplificationStep, TruthTableData, ValueFormat };

type TruthTableProps = {
  truthTable: TruthTableData | null;
  simplifiedExpression?: string;
  simplificationSteps?: SimplificationStep[];
};

export default function TruthTable({
  truthTable,
  simplifiedExpression,
  simplificationSteps = [],
}: TruthTableProps) {
  const formatGroupId = useId();
  const [format, setFormat] = useState<ValueFormat>("binary");

  const steps = useMemo(() => {
    if (simplificationSteps.length > 0) {
      return simplificationSteps;
    }
    if (simplifiedExpression) {
      return [
        {
          title: "Minimal sum of products",
          expression: simplifiedExpression,
          latex: toLatex(simplifiedExpression),
        },
      ];
    }
    return [];
  }, [simplificationSteps, simplifiedExpression]);

  if (!truthTable || truthTable.matrix.length === 0) {
    return (
      <section className="truth-panel">
        <p>No truth table to display yet.</p>
      </section>
    );
  }

  const headers = truthTable.headers;
  const outputIndex = headers.length - 1;

  return (
    <>
      <section className="truth-panel">
        <div className="truth-panel__toolbar">
          <h2>Truth table</h2>
          <form className="truth-panel__format" onSubmit={(event) => event.preventDefault()}>
            <fieldset>
              <legend>Value format</legend>
              <label htmlFor={`${formatGroupId}-binary`}>
                <input
                  id={`${formatGroupId}-binary`}
                  type="radio"
                  name={`${formatGroupId}-format`}
                  value="binary"
                  checked={format === "binary"}
                  onChange={() => setFormat("binary")}
                />
                0 / 1
              </label>
              <label htmlFor={`${formatGroupId}-boolean`}>
                <input
                  id={`${formatGroupId}-boolean`}
                  type="radio"
                  name={`${formatGroupId}-format`}
                  value="boolean"
                  checked={format === "boolean"}
                  onChange={() => setFormat("boolean")}
                />
                T / F
              </label>
            </fieldset>
          </form>
        </div>

        <div className="truth-panel__table-wrap overflow-x-auto overscroll-x-contain">
          <table>
            <caption>
              Complete {truthTable.matrix.length}-row truth table. The highlighted column is
              the circuit output F.
            </caption>
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={header}
                    scope="col"
                    className={index === outputIndex ? "is-output" : undefined}
                  >
                    {index === outputIndex ? `${headerLabel(header)} (output)` : header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {truthTable.matrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, cellIndex) => (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      className={cellIndex === outputIndex ? "is-output" : undefined}
                    >
                      <span
                        className={
                          cellIndex === outputIndex
                            ? `truth-bit truth-bit--output truth-bit--${value}`
                            : "truth-bit"
                        }
                      >
                        {formatValue(value, format)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {steps.length > 0 ? (
        <section className="sop-panel" aria-labelledby="sop-heading">
          <h2 id="sop-heading">SOP equations</h2>
          <ol className="truth-panel__steps">
            {steps.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <h3>
                  <span aria-hidden="true">{index + 1}.</span> {step.title}
                </h3>
                <Formula tex={step.latex} />
                <p>
                  <code>{step.expression}</code>
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </>
  );
}

function Formula({ tex }: { tex: string }) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        throwOnError: false,
        displayMode: true,
        strict: "ignore",
      }),
    [tex],
  );

  return (
    <div
      className="truth-panel__formula"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function formatValue(value: number, format: ValueFormat): string {
  if (format === "boolean") {
    return value === 1 ? "T" : "F";
  }
  return value === 1 ? "1" : "0";
}

function headerLabel(header: string): string {
  return header === "output" ? "F" : header;
}

function toLatex(expression: string): string {
  return expression
    .replace(/\bNAND\b/gi, "\\uparrow")
    .replace(/\bNOR\b/gi, "\\downarrow")
    .replace(/\bAND\b/gi, "\\land")
    .replace(/\bXOR\b/gi, "\\oplus")
    .replace(/\bOR\b/gi, "\\lor")
    .replace(/\bNOT\b/gi, "\\neg")
    .replaceAll("&", "\\land")
    .replaceAll("|", "\\lor")
    .replaceAll("~", "\\neg")
    .replaceAll("^", "\\oplus");
}
