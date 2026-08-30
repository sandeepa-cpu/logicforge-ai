import type { CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { gateAccent } from "./astToFlow";
import { GateIcon } from "./GateIcons";
import type { InputPinData, LogicGateData, OutputPinData } from "./types";

export type InputPinNodeType = Node<InputPinData, "inputPin">;
export type OutputPinNodeType = Node<OutputPinData, "outputPin">;
export type LogicGateNodeType = Node<LogicGateData, "logicGate">;

export function InputPinNode({ data }: NodeProps<InputPinNodeType>) {
  return (
    <div className="pin-node pin-node--input" aria-label={`Input ${data.label}`}>
      <span className="pin-node__badge">{data.label}</span>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

export function OutputPinNode({ data }: NodeProps<OutputPinNodeType>) {
  return (
    <div className="pin-node pin-node--output" aria-label={`Output ${data.label}`}>
      <Handle type="target" position={Position.Left} id="in-0" />
      <span className="pin-node__badge">{data.label}</span>
    </div>
  );
}

export function LogicGateNode({ data }: NodeProps<LogicGateNodeType>) {
  const accent = gateAccent(data.gateType);
  const inputCount = Math.max(data.inputCount, data.gateType === "CONST" ? 0 : 1);
  const label = data.gateType === "CONST" ? String(data.value ?? 0) : data.label;

  return (
    <div
      className="gate-node"
      style={{ "--gate-accent": accent } as CSSProperties}
      aria-label={`${data.gateType} gate`}
    >
      {Array.from({ length: inputCount }, (_, index) => (
        <Handle
          key={index}
          type="target"
          position={Position.Left}
          id={`in-${index}`}
          style={{ top: `${((index + 1) / (inputCount + 1)) * 100}%` }}
        />
      ))}
      <GateIcon type={data.gateType} accent={accent} />
      <span className="gate-node__label">{label}</span>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

export const circuitNodeTypes = {
  inputPin: InputPinNode,
  outputPin: OutputPinNode,
  logicGate: LogicGateNode,
};
