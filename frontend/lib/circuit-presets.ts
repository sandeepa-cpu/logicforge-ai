export type CircuitPreset = {
  id: string;
  name: string;
  expression: string;
  note: string;
};

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  {
    id: "full-adder-sum",
    name: "Full Adder (Sum)",
    expression: "(A XOR B) XOR Cin",
    note: "S = A ⊕ B ⊕ Cin",
  },
  {
    id: "full-adder-carry",
    name: "Full Adder (Carry)",
    expression: "(A AND B) OR (Cin AND (A XOR B))",
    note: "Cout = AB + Cin(A ⊕ B)",
  },
  {
    id: "sr-flip-flop",
    name: "SR Flip-Flop (Q+)",
    expression: "S OR ((NOT R) AND Q)",
    note: "Next state Q+ = S + R̅Q (SR = 11 is forbidden)",
  },
  {
    id: "half-adder-sum",
    name: "Half Adder (Sum)",
    expression: "A XOR B",
    note: "S = A ⊕ B",
  },
  {
    id: "half-adder-carry",
    name: "Half Adder (Carry)",
    expression: "A AND B",
    note: "C = AB",
  },
];
