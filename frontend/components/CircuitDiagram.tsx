"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { astToFlow, gateAccent } from "./circuit/astToFlow";
import { circuitNodeTypes } from "./circuit/nodes";
import type { CircuitAST, GateKind } from "./circuit/types";
import "./CircuitDiagram.css";

export type { CircuitAST, CircuitConnection, CircuitGate, CircuitInput, CircuitOutput } from "./circuit/types";

type CircuitDiagramProps = {
  ast: CircuitAST | null;
};

export default function CircuitDiagram({ ast }: CircuitDiagramProps) {
  return (
    <ReactFlowProvider>
      <CircuitCanvas ast={ast} />
    </ReactFlowProvider>
  );
}

function CircuitCanvas({ ast }: CircuitDiagramProps) {
  const { fitView } = useReactFlow();
  const graph = useMemo(() => (ast ? astToFlow(ast) : { nodes: [], edges: [] }), [ast]);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
    const frame = window.requestAnimationFrame(() => {
      fitView({ padding: 0.24, duration: 200 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, graph, setEdges, setNodes]);

  useEffect(() => {
    const fit = () => fitView({ padding: 0.24, duration: 0 });
    const onResize = () => fitView({ padding: 0.24, duration: 160 });
    window.addEventListener("resize", onResize);
    window.addEventListener("beforeprint", fit);
    window.addEventListener("logicforge:fit-diagram", fit);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("beforeprint", fit);
      window.removeEventListener("logicforge:fit-diagram", fit);
    };
  }, [fitView]);

  if (!ast || (ast.inputs.length === 0 && ast.gates.length === 0)) {
    return (
      <div className="circuit-diagram circuit-diagram--empty">
        <p>No circuit to display yet.</p>
      </div>
    );
  }

  return (
    <div className="circuit-diagram">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={circuitNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.24 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        preventScrolling
        minZoom={0.35}
        maxZoom={1.8}
        proOptions={{ hideAttribution: false }}
        attributionPosition="bottom-right"
      >
        <Background
          id="circuit-grid"
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color="rgba(148, 163, 184, 0.28)"
        />
        <Controls
          showInteractive={false}
          className="max-md:[&_button]:min-h-12 max-md:[&_button]:min-w-12"
        />
        <MiniMap
          className="hidden lg:block"
          pannable
          zoomable
          maskColor="rgba(8, 12, 18, 0.72)"
          nodeColor={(node) => {
            if (node.type === "inputPin") return "#38bdf8";
            if (node.type === "outputPin") return "#34d399";
            const gateType = (node.data as { gateType?: GateKind }).gateType ?? "AND";
            return gateAccent(gateType);
          }}
        />
      </ReactFlow>
    </div>
  );
}
