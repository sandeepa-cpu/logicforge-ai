"use client";

import { useId, useRef } from "react";

import { keepInputVisible } from "@/lib/keep-input-visible";
import "./ExpressionInput.css";

type ExpressionInputProps = {
  value: string;
  busy?: boolean;
  error?: string;
  onChange: (value: string) => void;
  onSubmitExpression: (expression: string) => void;
};

const PRESETS = [
  { name: "SOP 3-var", expression: "(A AND B) OR (NOT A AND C)" },
  { name: "XOR", expression: "A XOR B" },
  { name: "NAND", expression: "A NAND B" },
  { name: "NOR", expression: "A NOR B" },
  { name: "De Morgan", expression: "NOT (A OR B)" },
  { name: "Distribute", expression: "A AND (B OR C)" },
  { name: "Majority", expression: "(A AND B) OR (A AND C) OR (B AND C)" },
  { name: "POS", expression: "(A OR B) AND (NOT A OR C)" },
] as const;

const SYMBOLS = [
  { label: "∧", token: " ∧ ", name: "AND" },
  { label: "∨", token: " ∨ ", name: "OR" },
  { label: "¬", token: "¬", name: "NOT" },
] as const;

export default function ExpressionInput({
  value,
  busy = false,
  error,
  onChange,
  onSubmitExpression,
}: ExpressionInputProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;
  const inputRef = useRef<HTMLInputElement>(null);

  function insertToken(token: string) {
    const field = inputRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      field?.focus();
      const caret = start + token.length;
      field?.setSelectionRange(caret, caret);
    });
  }

  function applyPreset(expression: string) {
    onChange(expression);
    onSubmitExpression(expression);
  }

  return (
    <form
      className="expression-input"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitExpression(value.trim());
      }}
    >
      <div className="expression-input__head">
        <label htmlFor={fieldId}>Boolean expression</label>
        <p id={helpId} className="expression-input__help">
          Type a custom expression, or insert <span aria-hidden="true">∧ ∨ ¬</span> with the
          buttons.
        </p>
      </div>
      <div className="expression-input__row max-md:flex-col">
        <input
          ref={inputRef}
          id={fieldId}
          name="expression"
          type="text"
          value={value}
          maxLength={2000}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="done"
          disabled={busy}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
          aria-invalid={Boolean(error)}
          placeholder="(A AND B) OR (NOT A AND C)"
          className="max-md:min-h-12 max-md:w-full max-md:px-4 max-md:py-3"
          onFocus={(event) => keepInputVisible(event.currentTarget)}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="max-md:min-h-12 max-md:w-full max-md:px-4 max-md:py-3"
        >
          {busy ? "Parsing…" : "Parse"}
        </button>
        <div className="expression-input__symbols max-md:w-full max-md:flex-wrap" role="group" aria-label="Insert logic symbols">
          {SYMBOLS.map((symbol) => (
            <button
              key={symbol.name}
              type="button"
              disabled={busy}
              onClick={() => insertToken(symbol.token)}
              aria-label={`Insert ${symbol.name}`}
              className="max-md:min-h-12 max-md:px-4 max-md:py-3"
            >
              <span aria-hidden="true">{symbol.label}</span>
              <span>{symbol.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="expression-input__presets" role="group" aria-label="A/L past paper presets">
        <p className="expression-input__presets-label">Past paper presets</p>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            disabled={busy}
            title={preset.expression}
            className="max-md:min-h-12 max-md:px-4 max-md:py-3"
            onClick={() => applyPreset(preset.expression)}
          >
            {preset.name}
          </button>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="expression-input__error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
