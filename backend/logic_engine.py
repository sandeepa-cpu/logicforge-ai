"""Boolean logic engine built on SymPy boolalg.

Parses raw Boolean strings (symbol or word form), extracts variables,
builds truth tables, simplifies to minimal DNF (SOP), and emits an AST
graph suitable for logic-diagram rendering.
"""

from __future__ import annotations

import re
from itertools import product
from typing import Any

from sympy import Symbol, false, latex, simplify_logic, true
from sympy.logic.boolalg import And, BooleanFunction, Nand, Nor, Not, Or, Xor, to_dnf

MAX_EXPRESSION_LENGTH = 2000
MAX_VARIABLES = 12

_OPERATOR_WORDS = (
    ("NAND", "NAND"),
    ("NOR", "NOR"),
    ("AND", "&"),
    ("XOR", "^"),
    ("OR", "|"),
    ("NOT", "~"),
)

_WORD_TO_SYMBOL = (
    (re.compile(r"\bNAND\b", re.IGNORECASE), " NAND "),
    (re.compile(r"\bNOR\b", re.IGNORECASE), " NOR "),
    (re.compile(r"\bAND\b", re.IGNORECASE), " & "),
    (re.compile(r"\bXOR\b", re.IGNORECASE), " ^ "),
    (re.compile(r"\bOR\b", re.IGNORECASE), " | "),
    (re.compile(r"\bNOT\b", re.IGNORECASE), " ~ "),
    (re.compile(r"[∧·]"), " & "),
    (re.compile(r"[∨+]"), " | "),
    (re.compile(r"[¬!]"), " ~ "),
)

_TOKEN_SPEC = (
    ("LPAREN", r"\("),
    ("RPAREN", r"\)"),
    ("NAND", r"NAND\b"),
    ("NOR", r"NOR\b"),
    ("AND", r"&|∧|·"),
    ("XOR", r"\^"),
    ("OR", r"\||∨"),
    ("NOT", r"~|¬|!"),
    ("TRUE", r"TRUE\b"),
    ("FALSE", r"FALSE\b"),
    ("IDENT", r"[A-Za-z_][A-Za-z0-9_]*"),
)

_TOKEN_RE = re.compile(
    "|".join(f"(?P<{name}>{pattern})" for name, pattern in _TOKEN_SPEC),
    re.IGNORECASE,
)
_SPACE_RE = re.compile(r"\s+")


class LogicEngineError(ValueError):
    """Raised when a Boolean expression cannot be parsed or evaluated."""


class LogicEngine:
    """Analyze a raw Boolean expression with SymPy."""

    def __init__(self, expression: str) -> None:
        if not isinstance(expression, str):
            raise LogicEngineError("Expression must be a string.")

        raw = expression.strip()
        if not raw:
            raise LogicEngineError("Expression cannot be empty.")
        if len(raw) > MAX_EXPRESSION_LENGTH:
            raise LogicEngineError(
                f"Expression exceeds the {MAX_EXPRESSION_LENGTH}-character limit."
            )

        self.raw_expression = raw
        self.standardized = self.standardize(raw)
        self._expr = _Parser(self.standardized).parse()
        self._symbols = {
            str(symbol): symbol for symbol in sorted(self._expr.free_symbols, key=str)
        }
        if len(self._symbols) > MAX_VARIABLES:
            raise LogicEngineError(
                f"Too many variables ({len(self._symbols)}). Maximum is {MAX_VARIABLES}."
            )

    @staticmethod
    def standardize(expression: str) -> str:
        """Normalize word operators to symbols: AND->&, OR->|, NOT->~, XOR->^.

        NAND and NOR have no single-character SymPy infix form, so they are
        kept as uppercase word tokens after surrounding whitespace is cleaned.
        """
        standardized = expression.strip()
        for pattern, replacement in _WORD_TO_SYMBOL:
            standardized = pattern.sub(replacement, standardized)
        standardized = re.sub(r"[ \t]+", " ", standardized)
        return standardized.strip()

    def extract_variables(self) -> list[str]:
        """Return unique variable names sorted alphabetically."""
        return list(self._symbols.keys())

    def generate_truth_table(self) -> dict[str, Any]:
        """Build a complete 2^N truth table of binary inputs and the output."""
        variables = self.extract_variables()
        headers = [*variables, "output"]
        matrix: list[list[int]] = []
        rows: list[dict[str, int]] = []

        combinations: tuple[tuple[int, ...], ...]
        if variables:
            combinations = tuple(product((0, 1), repeat=len(variables)))
        else:
            combinations = ((),)

        for bits in combinations:
            assignment = {name: bool(bit) for name, bit in zip(variables, bits)}
            output = self._evaluate(assignment)
            row_bits = [*bits, output]
            matrix.append(row_bits)
            rows.append({name: value for name, value in zip(headers, row_bits)})

        return {
            "variables": variables,
            "headers": headers,
            "matrix": matrix,
            "rows": rows,
        }

    def simplify(self) -> str:
        """Return the minimal DNF (sum-of-products) form as a string."""
        simplified = simplify_logic(self._expr, form="dnf")
        return self._format_expr(simplified)

    def simplification_steps(self) -> list[dict[str, str]]:
        """Return pedagogical simplify steps with KaTeX-ready LaTeX."""
        expanded = to_dnf(self._expr, simplify=False)
        minimal = simplify_logic(self._expr, form="dnf")

        candidates = [
            {
                "title": "Original expression",
                "expression": self.raw_expression,
                "latex": _string_to_latex(self.raw_expression),
            },
            {
                "title": "Standardized operators",
                "expression": self.standardized,
                "latex": _string_to_latex(self.standardized),
            },
            {
                "title": "Expanded disjunctive form",
                "expression": self._format_expr(expanded),
                "latex": latex(expanded),
            },
            {
                "title": "Minimal sum of products",
                "expression": self._format_expr(minimal),
                "latex": latex(minimal),
            },
        ]

        steps: list[dict[str, str]] = []
        seen: set[str] = set()
        for step in candidates:
            key = step["expression"].replace(" ", "")
            if key in seen:
                continue
            seen.add(key)
            steps.append(step)
        return steps

    def build_ast(self) -> dict[str, Any]:
        """Build a gate/pin/connection AST dictionary for diagram rendering."""
        inputs: list[dict[str, str]] = []
        input_ids: dict[str, str] = {}
        for name in self.extract_variables():
            node_id = f"pin_{name}"
            input_ids[name] = node_id
            inputs.append({"id": node_id, "label": name, "type": "input"})

        gates: list[dict[str, Any]] = []
        connections: list[dict[str, Any]] = []
        memo: dict[str, str] = {}
        counter = 0

        def next_id(prefix: str) -> str:
            nonlocal counter
            counter += 1
            return f"{prefix}_{counter}"

        def walk(expr: Any) -> str:
            key = str(expr)
            if key in memo:
                return memo[key]

            if expr == true:
                node_id = next_id("const")
                gates.append(
                    {"id": node_id, "type": "CONST", "value": 1, "inputs": []}
                )
                memo[key] = node_id
                return node_id

            if expr == false:
                node_id = next_id("const")
                gates.append(
                    {"id": node_id, "type": "CONST", "value": 0, "inputs": []}
                )
                memo[key] = node_id
                return node_id

            if isinstance(expr, Symbol):
                return input_ids[str(expr)]

            gate_type = _gate_type(expr)
            child_ids = [walk(arg) for arg in expr.args]
            node_id = next_id("gate")
            gates.append({"id": node_id, "type": gate_type, "inputs": child_ids})
            for pin_index, child_id in enumerate(child_ids):
                connections.append(
                    {"from": child_id, "to": node_id, "to_pin": pin_index}
                )
            memo[key] = node_id
            return node_id

        root_id = walk(self._expr)
        output = {"id": "out_F", "label": "F", "type": "output"}
        connections.append({"from": root_id, "to": output["id"], "to_pin": 0})

        return {
            "inputs": inputs,
            "gates": gates,
            "output": output,
            "connections": connections,
            "tree": self.build_operation_tree(),
        }

    def build_operation_tree(self) -> dict[str, Any]:
        """Return a nested AND/OR/NOT tree the frontend can walk to draw gates."""

        def walk(expr: Any) -> dict[str, Any]:
            if expr == true:
                return {"type": "CONST", "value": 1}
            if expr == false:
                return {"type": "CONST", "value": 0}
            if isinstance(expr, Symbol):
                return {"type": "VAR", "name": str(expr)}
            return {
                "type": _gate_type(expr),
                "children": [walk(arg) for arg in expr.args],
            }

        return walk(self._expr)

    def parse_expression(self) -> dict[str, Any]:
        """Return the /api/parse-expression payload."""
        return {
            "variables": self.extract_variables(),
            "truth_table": self.generate_truth_table(),
            "simplified_expression": self.simplify(),
            "simplification_steps": self.simplification_steps(),
            "ast": self.build_ast(),
        }

    def analyze(self) -> dict[str, Any]:
        """Return variables, truth table, simplified SOP, and AST together."""
        return {
            "raw": self.raw_expression,
            "standardized": self.standardized,
            "variables": self.extract_variables(),
            "simplified": self.simplify(),
            "simplification_steps": self.simplification_steps(),
            "truth_table": self.generate_truth_table(),
            "ast": self.build_ast(),
        }

    def _evaluate(self, assignment: dict[str, bool]) -> int:
        substitutions = {
            self._symbols[name]: value for name, value in assignment.items()
        }
        result = self._expr.subs(substitutions)
        if result == true:
            return 1
        if result == false:
            return 0
        raise LogicEngineError("Expression did not evaluate to a Boolean constant.")

    @staticmethod
    def _format_expr(expr: Any) -> str:
        if expr == true:
            return "1"
        if expr == false:
            return "0"
        return str(expr)


def _string_to_latex(expression: str) -> str:
    """Convert a Boolean string into a KaTeX-safe operator form."""
    converted = expression
    replacements = (
        (r"\bNAND\b", " \\uparrow "),
        (r"\bNOR\b", " \\downarrow "),
        (r"\bAND\b", " \\land "),
        (r"\bXOR\b", " \\oplus "),
        (r"\bOR\b", " \\lor "),
        (r"\bNOT\b", " \\neg "),
    )
    for pattern, replacement in replacements:
        converted = re.sub(
            pattern,
            lambda _match, token=replacement: token,
            converted,
            flags=re.IGNORECASE,
        )
    converted = converted.replace("&", r" \land ")
    converted = converted.replace("|", r" \lor ")
    converted = converted.replace("~", r" \neg ")
    converted = converted.replace("^", r" \oplus ")
    return re.sub(r"\s+", " ", converted).strip()


def _gate_type(expr: Any) -> str:
    if isinstance(expr, Nand):
        return "NAND"
    if isinstance(expr, Nor):
        return "NOR"
    if isinstance(expr, And):
        return "AND"
    if isinstance(expr, Or):
        return "OR"
    if isinstance(expr, Not):
        return "NOT"
    if isinstance(expr, Xor):
        return "XOR"
    if isinstance(expr, BooleanFunction):
        return type(expr).__name__.upper()
    raise LogicEngineError(f"Unsupported Boolean node: {type(expr).__name__}")


class _Parser:
    """Recursive-descent parser that emits SymPy Boolean expressions.

    Precedence (high to low): NOT, AND/NAND, XOR, OR/NOR.
    """

    def __init__(self, expression: str) -> None:
        self._tokens = _tokenize(expression)
        self._index = 0

    def parse(self) -> Any:
        if not self._tokens:
            raise LogicEngineError("Expression cannot be empty.")
        expr = self._parse_or()
        if self._index < len(self._tokens):
            leftover = self._tokens[self._index][1]
            raise LogicEngineError(f"Unexpected token '{leftover}'.")
        return expr

    def _parse_or(self) -> Any:
        node = self._parse_xor()
        while self._match("OR", "NOR"):
            operator = self._previous()[0]
            right = self._parse_xor()
            node = (
                Nor(node, right, evaluate=False)
                if operator == "NOR"
                else Or(node, right)
            )
        return node

    def _parse_xor(self) -> Any:
        node = self._parse_and()
        while self._match("XOR"):
            right = self._parse_and()
            node = Xor(node, right)
        return node

    def _parse_and(self) -> Any:
        node = self._parse_not()
        while self._match("AND", "NAND"):
            operator = self._previous()[0]
            right = self._parse_not()
            node = (
                Nand(node, right, evaluate=False)
                if operator == "NAND"
                else And(node, right)
            )
        return node

    def _parse_not(self) -> Any:
        if self._match("NOT"):
            return Not(self._parse_not())
        return self._parse_primary()

    def _parse_primary(self) -> Any:
        if self._match("TRUE"):
            return true
        if self._match("FALSE"):
            return false
        if self._match("IDENT"):
            name = self._previous()[1]
            if name.upper() in {word for word, _ in _OPERATOR_WORDS}:
                raise LogicEngineError(f"'{name}' is a reserved operator.")
            return Symbol(name)
        if self._match("LPAREN"):
            expr = self._parse_or()
            if not self._match("RPAREN"):
                raise LogicEngineError("Missing closing parenthesis.")
            return expr
        if self._index >= len(self._tokens):
            raise LogicEngineError("Unexpected end of expression.")
        raise LogicEngineError(f"Unexpected token '{self._tokens[self._index][1]}'.")

    def _match(self, *kinds: str) -> bool:
        if self._index < len(self._tokens) and self._tokens[self._index][0] in kinds:
            self._index += 1
            return True
        return False

    def _previous(self) -> tuple[str, str]:
        return self._tokens[self._index - 1]


def _tokenize(expression: str) -> list[tuple[str, str]]:
    tokens: list[tuple[str, str]] = []
    index = 0
    length = len(expression)

    while index < length:
        space = _SPACE_RE.match(expression, index)
        if space:
            index = space.end()
            if index >= length:
                break

        match = _TOKEN_RE.match(expression, index)
        if not match or match.lastgroup is None:
            snippet = expression[index : index + 12]
            raise LogicEngineError(f"Invalid token near '{snippet}'.")

        kind = match.lastgroup
        value = match.group()
        if kind in {"NAND", "NOR", "AND", "XOR", "OR", "NOT", "TRUE", "FALSE"}:
            kind = kind.upper()
            value = value.upper()
        tokens.append((kind, value))
        index = match.end()

    return tokens
