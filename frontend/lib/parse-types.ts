import type { CircuitAST } from "@/components/circuit/types";
import type { SimplificationStep, TruthTableData } from "@/components/truth-table/types";

export type ParseResult = {
  variables: string[];
  truth_table: TruthTableData;
  simplified_expression: string;
  simplification_steps: SimplificationStep[];
  ast: CircuitAST;
};
