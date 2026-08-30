"use client";

import { useId, useMemo } from "react";

import type { TruthTableData } from "@/components/truth-table/types";
import { buildKMap } from "@/lib/kmap";
import "./KMapGrid.css";

type KMapGridProps = {
  truthTable: TruthTableData | null;
};

export default function KMapGrid({ truthTable }: KMapGridProps) {
  const headingId = useId();
  const layout = useMemo(
    () => (truthTable ? buildKMap(truthTable) : { error: "No truth table to map yet." }),
    [truthTable],
  );

  return (
    <details className="kmap" open>
      <summary className="kmap__summary">K-Map Reduction</summary>
      {"error" in layout ? (
        <p className="kmap__empty">{layout.error}</p>
      ) : (
        <div className="kmap__body overflow-x-auto overscroll-x-contain">
          <p className="kmap__lead">
            Gray-coded map for {layout.variables.join(", ")}. Matching 1-cells are grouped
            into the largest legal loops (1, 2, 4, 8, or 16).
          </p>
          <div
            className="kmap-grid"
            role="table"
            aria-labelledby={headingId}
            style={{
              gridTemplateColumns: `auto repeat(${layout.colLabels.length}, minmax(3.4rem, 1fr))`,
            }}
          >
            <div className="kmap-grid__corner" role="columnheader">
              <span className="kmap-grid__rowvars">
                {layout.rowVars.length > 0 ? layout.rowVars.join("") : " "}
              </span>
              <span className="kmap-grid__colvars">{layout.colVars.join("")}</span>
            </div>
            {layout.colLabels.map((label) => (
              <div key={`col-${label}`} className="kmap-grid__colhead" role="columnheader">
                {label || "—"}
              </div>
            ))}
            {layout.rowLabels.map((rowLabel, row) => (
              <div key={`row-${rowLabel || row}`} className="kmap-row" role="row">
                <div className="kmap-grid__rowhead" role="rowheader">
                  {rowLabel || "—"}
                </div>
                {layout.colLabels.map((colLabel, col) => {
                  const cell = layout.cells.find((item) => item.row === row && item.col === col);
                  if (!cell) {
                    return null;
                  }
                  const groups = layout.groups.filter((group) => cell.groupIds.includes(group.id));
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={
                        cell.value === 1 ? "kmap-cell kmap-cell--one" : "kmap-cell kmap-cell--zero"
                      }
                      role="cell"
                      style={cellOverlay(groups.map((group) => group.color))}
                    >
                      <span className="kmap-cell__minterm">m{cell.minterm}</span>
                      <span className="kmap-cell__value">{cell.value}</span>
                      {groups.length > 0 ? (
                        <span className="kmap-cell__tags" aria-hidden="true">
                          {groups.map((group) => (
                            <span key={group.id} style={{ background: group.color }} />
                          ))}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <h3 id={headingId} className="kmap__groups-title">
            Grouped minterms
          </h3>
          {layout.groups.length === 0 ? (
            <p className="kmap__empty">No 1-cells — the function is 0.</p>
          ) : (
            <ol className="kmap__groups">
              {layout.groups.map((group) => (
                <li key={group.id}>
                  <span className="kmap__swatch" style={{ background: group.color }} />
                  <span>
                    <strong>{group.term}</strong>
                    <span className="kmap__minterms">
                      {" "}
                      ← {group.minterms.map((minterm) => `m${minterm}`).join(", ")}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="kmap__sop">
            <span>K-map SOP</span> {layout.sop}
          </p>
        </div>
      )}
    </details>
  );
}

function cellOverlay(colors: string[]): { boxShadow?: string } | undefined {
  if (colors.length === 0) {
    return undefined;
  }
  const shadows = colors.map((color, index) => `inset 0 0 0 ${3 + index * 3}px ${color}`);
  return { boxShadow: shadows.join(", ") };
}
