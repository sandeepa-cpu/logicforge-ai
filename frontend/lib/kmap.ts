import type { TruthTableData } from "@/components/truth-table/types";

export type Bit = 0 | 1 | "-";

export type KMapGroup = {
  id: string;
  bits: Bit[];
  minterms: number[];
  term: string;
  color: string;
  fill: string;
};

export type KMapCell = {
  row: number;
  col: number;
  minterm: number;
  value: 0 | 1;
  bits: string;
  groupIds: string[];
};

export type KMapLayout = {
  variables: string[];
  rowVars: string[];
  colVars: string[];
  rowLabels: string[];
  colLabels: string[];
  cells: KMapCell[];
  groups: KMapGroup[];
  sop: string;
};

const GROUP_PALETTE = [
  { color: "#38bdf8", fill: "rgba(56, 189, 248, 0.2)" },
  { color: "#34d399", fill: "rgba(52, 211, 153, 0.2)" },
  { color: "#fbbf24", fill: "rgba(251, 191, 36, 0.22)" },
  { color: "#f472b6", fill: "rgba(244, 114, 182, 0.2)" },
  { color: "#a78bfa", fill: "rgba(167, 139, 250, 0.22)" },
  { color: "#f87171", fill: "rgba(248, 113, 113, 0.2)" },
] as const;

export function grayCodes(bits: number): string[] {
  if (bits <= 0) {
    return [""];
  }
  const count = 1 << bits;
  const codes: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const gray = index ^ (index >> 1);
    codes.push(gray.toString(2).padStart(bits, "0"));
  }
  return codes;
}

export function mintermsFromTable(table: TruthTableData): number[] {
  const width = table.variables.length;
  const ones: number[] = [];
  for (const row of table.matrix) {
    const bits = row.slice(0, width);
    const output = row[row.length - 1] ?? 0;
    if (output === 1) {
      ones.push(width === 0 ? 0 : Number.parseInt(bits.join(""), 2));
    }
  }
  return [...new Set(ones)].sort((left, right) => left - right);
}

function toBits(minterm: number, width: number): Bit[] {
  return minterm
    .toString(2)
    .padStart(width, "0")
    .split("")
    .map((bit) => (bit === "1" ? 1 : 0));
}

function combineBits(left: Bit[], right: Bit[]): Bit[] | null {
  let diffs = 0;
  const next: Bit[] = [];
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      if (left[index] === "-" || right[index] === "-") {
        return null;
      }
      diffs += 1;
      next.push("-");
    } else {
      next.push(left[index] ?? "-");
    }
  }
  return diffs === 1 ? next : null;
}

function formatTerm(bits: Bit[], variables: string[]): string {
  const parts = variables
    .map((name, index) => {
      if (bits[index] === "-") {
        return null;
      }
      return bits[index] === 0 ? `¬${name}` : name;
    })
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" ∧ ") : "1";
}

function covers(bits: Bit[], minterm: number): boolean {
  const value = toBits(minterm, bits.length);
  return bits.every((bit, index) => bit === "-" || bit === value[index]);
}

function primeImplicants(minterms: number[], width: number): { bits: Bit[]; minterms: number[] }[] {
  if (minterms.length === 0) {
    return [];
  }
  if (width > 0 && minterms.length === 1 << width) {
    return [{ bits: Array<Bit>(width).fill("-"), minterms: [...minterms] }];
  }

  type Cube = { bits: Bit[]; minterms: number[]; used: boolean };
  let current: Cube[] = minterms.map((minterm) => ({
    bits: toBits(minterm, width),
    minterms: [minterm],
    used: false,
  }));
  const primes: Cube[] = [];

  while (current.length > 0) {
    const next: Cube[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < current.length; i += 1) {
      for (let j = i + 1; j < current.length; j += 1) {
        const left = current[i];
        const right = current[j];
        if (!left || !right) {
          continue;
        }
        const combined = combineBits(left.bits, right.bits);
        if (!combined) {
          continue;
        }
        left.used = true;
        right.used = true;
        const key = combined.join("");
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        next.push({
          bits: combined,
          minterms: [...new Set([...left.minterms, ...right.minterms])].sort((a, b) => a - b),
          used: false,
        });
      }
    }
    for (const cube of current) {
      if (!cube.used) {
        primes.push(cube);
      }
    }
    current = next;
  }

  return primes;
}

function selectCover(
  primes: { bits: Bit[]; minterms: number[] }[],
  minterms: number[],
): { bits: Bit[]; minterms: number[] }[] {
  const remaining = new Set(minterms);
  const selected: { bits: Bit[]; minterms: number[] }[] = [];
  const unused = [...primes].sort((left, right) => dashCount(right.bits) - dashCount(left.bits));

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const minterm of [...remaining]) {
      if (!remaining.has(minterm)) {
        continue;
      }
      const options = unused.filter((prime) => prime.minterms.includes(minterm));
      if (options.length === 1 && options[0]) {
        const pick = options[0];
        selected.push(pick);
        unused.splice(unused.indexOf(pick), 1);
        for (const covered of pick.minterms) {
          remaining.delete(covered);
        }
        progressed = true;
      }
    }
  }

  while (remaining.size > 0 && unused.length > 0) {
    unused.sort((left, right) => {
      const leftHits = left.minterms.filter((minterm) => remaining.has(minterm)).length;
      const rightHits = right.minterms.filter((minterm) => remaining.has(minterm)).length;
      if (rightHits !== leftHits) {
        return rightHits - leftHits;
      }
      return dashCount(right.bits) - dashCount(left.bits);
    });
    const best = unused.shift();
    if (!best || !best.minterms.some((minterm) => remaining.has(minterm))) {
      break;
    }
    selected.push(best);
    for (const covered of best.minterms) {
      remaining.delete(covered);
    }
  }

  return dropRedundant(selected);
}

function dashCount(bits: Bit[]): number {
  return bits.filter((bit) => bit === "-").length;
}

function dropRedundant(
  selected: { bits: Bit[]; minterms: number[] }[],
): { bits: Bit[]; minterms: number[] }[] {
  return selected.filter((prime, index) => {
    const others = selected.filter((_, otherIndex) => otherIndex !== index);
    return prime.minterms.some(
      (minterm) => !others.some((other) => other.minterms.includes(minterm)),
    );
  });
}

export function buildKMap(table: TruthTableData): KMapLayout | { error: string } {
  const variables = table.variables;
  const width = variables.length;
  if (width < 1 || width > 4) {
    return {
      error:
        width === 0
          ? "This expression has no input variables, so a K-map is not drawn."
          : `K-maps here support 1–4 variables. This circuit has ${width} inputs.`,
    };
  }

  const rowBits = width <= 2 ? Math.max(0, width - 1) : Math.floor(width / 2);
  const colBits = width - rowBits;
  const rowVars = variables.slice(0, rowBits);
  const colVars = variables.slice(rowBits);
  const rowLabels = grayCodes(rowBits);
  const colLabels = grayCodes(colBits);
  const ones = mintermsFromTable(table);
  const chosen = selectCover(primeImplicants(ones, width), ones);

  const groups: KMapGroup[] = chosen.map((prime, index) => {
    const palette = GROUP_PALETTE[index % GROUP_PALETTE.length] ?? GROUP_PALETTE[0];
    return {
      id: `g${index + 1}`,
      bits: prime.bits,
      minterms: prime.minterms,
      term: formatTerm(prime.bits, variables),
      color: palette.color,
      fill: palette.fill,
    };
  });

  const cells: KMapCell[] = [];
  for (let row = 0; row < rowLabels.length; row += 1) {
    for (let col = 0; col < colLabels.length; col += 1) {
      const bits = `${rowLabels[row] ?? ""}${colLabels[col] ?? ""}`;
      const minterm = Number.parseInt(bits || "0", 2);
      const value: 0 | 1 = ones.includes(minterm) ? 1 : 0;
      cells.push({
        row,
        col,
        minterm,
        value,
        bits,
        groupIds: groups.filter((group) => covers(group.bits, minterm)).map((group) => group.id),
      });
    }
  }

  const sop =
    ones.length === 0
      ? "0"
      : groups
          .map((group) =>
            groups.length > 1 && group.term.includes("∧") ? `(${group.term})` : group.term,
          )
          .join("  ∨  ") || "0";

  return {
    variables,
    rowVars,
    colVars,
    rowLabels,
    colLabels,
    cells,
    groups,
    sop,
  };
}
