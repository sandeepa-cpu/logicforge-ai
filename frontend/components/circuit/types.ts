export type GateKind =
  | "AND"
  | "OR"
  | "NOT"
  | "NAND"
  | "NOR"
  | "XOR"
  | "CONST"
  | string;

export type CircuitInput = {
  id: string;
  label: string;
  type: string;
};

export type CircuitGate = {
  id: string;
  type: GateKind;
  inputs: string[];
  value?: number | null;
};

export type CircuitOutput = {
  id: string;
  label: string;
  type: string;
};

export type CircuitConnection = {
  from: string;
  to: string;
  to_pin: number;
};

export type CircuitAST = {
  inputs: CircuitInput[];
  gates: CircuitGate[];
  output: CircuitOutput;
  connections: CircuitConnection[];
};

export type InputPinData = {
  label: string;
};

export type OutputPinData = {
  label: string;
};

export type LogicGateData = {
  gateType: GateKind;
  label: string;
  inputCount: number;
  value?: number | null;
};
