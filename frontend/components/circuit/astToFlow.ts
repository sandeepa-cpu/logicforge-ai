import type { Edge, Node } from "@xyflow/react";

import type { CircuitAST, GateKind } from "./types";

const COLUMN_GAP = 280;
const ROW_GAP = 156;

export function astToFlow(ast: CircuitAST): { nodes: Node[]; edges: Edge[] } {
  const depths = computeDepths(ast);
  const positions = layoutPositions(ast, depths);

  const nodes: Node[] = [];

  for (const input of ast.inputs) {
    const position = positions.get(input.id) ?? { x: 0, y: 0 };
    nodes.push({
      id: input.id,
      type: "inputPin",
      position,
      draggable: true,
      data: { label: input.label },
    });
  }

  for (const gate of ast.gates) {
    const position = positions.get(gate.id) ?? { x: COLUMN_GAP, y: 0 };
    nodes.push({
      id: gate.id,
      type: "logicGate",
      position,
      draggable: true,
      data: {
        gateType: gate.type,
        label: gate.type,
        inputCount: gate.inputs.length,
        value: gate.value ?? null,
      },
    });
  }

  const outputPosition = positions.get(ast.output.id) ?? { x: COLUMN_GAP * 2, y: 0 };
  nodes.push({
    id: ast.output.id,
    type: "outputPin",
    position: outputPosition,
    draggable: true,
    data: { label: ast.output.label },
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: Edge[] = ast.connections
    .filter((connection) => nodeIds.has(connection.from) && nodeIds.has(connection.to))
    .map((connection, index) => ({
      id: `${connection.from}->${connection.to}:${connection.to_pin}:${index}`,
      source: connection.from,
      sourceHandle: "out",
      target: connection.to,
      targetHandle: `in-${connection.to_pin}`,
      type: "smoothstep",
      style: { stroke: "var(--wire-color)", strokeWidth: 2 },
    }));

  return { nodes, edges };
}

function computeDepths(ast: CircuitAST): Map<string, number> {
  const depths = new Map<string, number>();
  const gates = new Map(ast.gates.map((gate) => [gate.id, gate]));

  for (const input of ast.inputs) {
    depths.set(input.id, 0);
  }

  const visiting = new Set<string>();

  const walk = (id: string): number => {
    const cached = depths.get(id);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(id)) {
      return 1;
    }

    const gate = gates.get(id);
    if (!gate) {
      return 0;
    }

    visiting.add(id);
    const depth =
      gate.inputs.length === 0
        ? 1
        : 1 + Math.max(...gate.inputs.map((source) => walk(source)));
    visiting.delete(id);
    depths.set(id, depth);
    return depth;
  };

  for (const gate of ast.gates) {
    walk(gate.id);
  }

  const outputSources = ast.connections
    .filter((connection) => connection.to === ast.output.id)
    .map((connection) => connection.from);
  const outputDepth =
    1 +
    (outputSources.length > 0
      ? Math.max(...outputSources.map((source) => walk(source)))
      : 0);
  depths.set(ast.output.id, outputDepth);

  return depths;
}

function layoutPositions(
  ast: CircuitAST,
  depths: Map<string, number>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  ast.inputs.forEach((input, index) => {
    positions.set(input.id, { x: 24, y: index * ROW_GAP + 24 });
  });

  const columns = new Map<number, string[]>();
  for (const gate of ast.gates) {
    const depth = depths.get(gate.id) ?? 1;
    const column = columns.get(depth) ?? [];
    column.push(gate.id);
    columns.set(depth, column);
  }

  const predecessors = (id: string): string[] => {
    const gate = ast.gates.find((item) => item.id === id);
    if (gate) {
      return gate.inputs;
    }
    return ast.connections
      .filter((connection) => connection.to === id)
      .map((connection) => connection.from);
  };

  const sortedDepths = [...columns.keys()].sort((a, b) => a - b);
  for (const depth of sortedDepths) {
    const ids = columns.get(depth) ?? [];
    ids.sort((a, b) => averageY(predecessors(a), positions) - averageY(predecessors(b), positions));

    const occupied: number[] = [];
    for (const id of ids) {
      let y = averageY(predecessors(id), positions);
      for (const other of occupied) {
        if (Math.abs(other - y) < ROW_GAP) {
          y = other + ROW_GAP;
        }
      }
      occupied.push(y);
      positions.set(id, { x: depth * COLUMN_GAP + 24, y });
    }
  }

  const outputDepth = depths.get(ast.output.id) ?? 1;
  const outputY = averageY(predecessors(ast.output.id), positions);
  positions.set(ast.output.id, { x: outputDepth * COLUMN_GAP + 24, y: outputY });

  return positions;
}

function averageY(
  ids: string[],
  positions: Map<string, { x: number; y: number }>,
): number {
  if (ids.length === 0) {
    return 24;
  }
  const total = ids.reduce((sum, id) => sum + (positions.get(id)?.y ?? 24), 0);
  return total / ids.length;
}

export function gateAccent(gateType: GateKind): string {
  switch (gateType) {
    case "AND":
      return "#7dd3fc";
    case "OR":
      return "#5eead4";
    case "NOT":
      return "#fbbf24";
    case "NAND":
      return "#c4b5fd";
    case "NOR":
      return "#67e8f9";
    case "XOR":
      return "#fb7185";
    case "CONST":
      return "#94a3b8";
    default:
      return "#cbd5e1";
  }
}
