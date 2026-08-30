"use client";

import dynamic from "next/dynamic";

import type { CircuitAST } from "./circuit/types";

const CircuitDiagram = dynamic(() => import("./CircuitDiagram"), {
  ssr: false,
  loading: () => <p>Loading circuit diagram…</p>,
});

export default function CircuitDiagramLoader({ ast }: { ast: CircuitAST }) {
  return <CircuitDiagram ast={ast} />;
}
