"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ErrorToast from "@/components/ErrorToast";
import type { TruthTableData } from "./truth-table/types";
import "./AIExplanation.css";

type AIExplanationProps = {
  expression: string;
  simplifiedExpression: string;
  truthTable: TruthTableData;
};

type Status = "idle" | "loading" | "typing" | "done" | "error";

export default function AIExplanation({
  expression,
  simplifiedExpression,
  truthTable,
}: AIExplanationProps) {
  const [buffer, setBuffer] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const characters = useMemo(() => Array.from(buffer), [buffer]);
  const visibleText = characters.slice(0, visibleCount).join("");
  const isStreaming = status === "loading" || status === "typing";

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(characters.length);
      if (status === "typing") {
        setStatus("done");
      }
      return;
    }

    if (visibleCount >= characters.length) {
      if (status === "typing") {
        setStatus("done");
      }
      return;
    }

    setStatus((current) => (current === "loading" ? "typing" : current));
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(characters.length, count + 2));
    }, 16);
    return () => window.clearTimeout(timer);
  }, [characters.length, reducedMotion, status, visibleCount]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function focusExplanation() {
    const node = sectionRef.current;
    if (!node) {
      return;
    }
    const chrome = document.querySelector(".workspace-chrome");
    const offset = (chrome?.getBoundingClientRect().height ?? 0) + 12;
    const top = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion ? "auto" : "smooth",
    });
    node.focus({ preventScroll: true });
  }

  async function requestExplanation() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBuffer("");
    setVisibleCount(0);
    setError("");
    setStatus("loading");
    window.requestAnimationFrame(() => {
      focusExplanation();
    });

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          expression,
          simplifiedExpression,
          truthTable,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        const payload = contentType.includes("application/json")
          ? ((await response.json().catch(() => null)) as { error?: string } | null)
          : null;
        const message =
          payload?.error ??
          (response.status === 503
            ? "Gemini is not ready yet. Check frontend/.env.local and try again."
            : `Explain request failed (${response.status}).`);
        console.error("[explain] request failed", response.status, message);
        setStatus("error");
        setError(message);
        return;
      }

      if (contentType.includes("application/json")) {
        const payload = (await response.json()) as { text?: string; error?: string };
        if (!payload.text?.trim()) {
          throw new Error(payload.error ?? "Empty explanation from Gemini.");
        }
        setBuffer(payload.text);
        setVisibleCount(Array.from(payload.text).length);
        setStatus("done");
        return;
      }

      if (!response.body) {
        throw new Error("Empty response from the explanation service.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let received = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          received += chunk;
          setBuffer(received);
          if (reducedMotion) {
            setStatus("done");
          }
        }
      }

      if (!received.trim()) {
        throw new Error("Gemini returned an empty explanation.");
      }

      setStatus((current) => (current === "loading" ? "typing" : current));
    } catch (cause) {
      if (controller.signal.aborted) {
        return;
      }
      console.error("[explain] client error", cause);
      setStatus("error");
      setError(
        cause instanceof Error ? cause.message : "Could not generate the explanation.",
      );
    }
  }

  return (
    <section
      ref={sectionRef}
      id="ai-explanation"
      className="ai-explanation"
      lang="si"
      tabIndex={-1}
    >
      <div className="ai-explanation__toolbar">
        <div>
          <h2>AI පැහැදිලි කිරීම</h2>
          <p>A/L ICT ගුරුවරයෙකු ලෙස Boolean ප්‍රකාශය සිංහලෙන් පියවරෙන් පියවර විස්තර කරයි.</p>
        </div>
        <button
          type="button"
          onClick={requestExplanation}
          disabled={isStreaming}
          aria-busy={isStreaming}
        >
          {isStreaming ? "ලියමින්..." : "සිංහලෙන් පැහැදිලි කරන්න"}
        </button>
      </div>

      <div
        className={
          status === "error"
            ? "ai-explanation__status ai-explanation__status--error"
            : "ai-explanation__status"
        }
        role="status"
        aria-live="polite"
      >
        {status === "loading" ? "පැහැදිලි කිරීම ලැබෙමින් පවතී." : null}
        {status === "done" ? "පැහැදිලි කිරීම සම්පූර්ණයි." : null}
        {status === "error" ? "පැහැදිලි කිරීම අසාර්ථකයි." : null}
      </div>

      <article className="ai-explanation__body" aria-busy={isStreaming}>
        {visibleText ? (
          <ExplanationContent text={visibleText} />
        ) : (
          <p className="ai-explanation__placeholder">
            ඉහත බොත්තම ඔබා Boolean ප්‍රකාශය, සරල කළ ස්වරූපය සහ truth table එක පාදක කරගෙන
            සිංහල පැහැදිලි කිරීමක් ලබා ගන්න.
          </p>
        )}
        {isStreaming ? <span className="ai-explanation__caret" aria-hidden="true" /> : null}
      </article>
      <ErrorToast
        open={status === "error" && Boolean(error)}
        message={error}
        onClose={() => setError("")}
      />
    </section>
  );
}

function ExplanationContent({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(block.text)}</p>;
      })}
    </>
  );
}

function parseBlocks(text: string): Array<
  { type: "list"; items: string[] } | { type: "paragraph"; text: string }
> {
  const blocks: Array<
    { type: "list"; items: string[] } | { type: "paragraph"; text: string }
  > = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      listItems.push(bullet[1] ?? "");
      continue;
    }
    flushList();
    blocks.push({ type: "paragraph", text: line });
  }
  flushList();
  return blocks;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return <strong key={index}>{bold[1]}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
