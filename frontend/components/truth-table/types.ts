export type TruthTableData = {
  variables: string[];
  headers: string[];
  matrix: number[][];
  rows?: Record<string, number>[];
};

export type SimplificationStep = {
  title: string;
  expression: string;
  latex: string;
};

export type ValueFormat = "binary" | "boolean";
