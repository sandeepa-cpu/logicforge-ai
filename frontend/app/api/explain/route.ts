import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import {
  getGeminiApiKey,
  getGeminiModel,
  MISSING_GEMINI_KEY_MESSAGE,
} from "@/lib/gemini-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TEACHER_PROMPT =
  "You are an expert Sri Lankan A/L ICT Teacher. Explain how this Boolean expression is parsed, simplified, and converted into logic gates step-by-step. Provide your explanation strictly in clear, simple Sinhala script (සිංහල අකුරෙන්). Use bullet points and bold key terms like Boolean Laws, AND Gate, OR Gate.";

const NETWORK_TEACHER_PROMPT = `You are an expert Sri Lankan G.C.E. A/L ICT teacher (Grades 12–13).
Write a complete exam-style written answer strictly in simple Sinhala script (සිංහල අකුරෙන්).
Start from absolute basics, as if the student has never seen computer networks.

Subnetting — ALWAYS include using the exact numbers in the user context:
1. What an IPv4 address is. Compare it to a house address on a letter.
2. Convert EACH decimal octet to 8-bit binary. Show place values 128 64 32 16 8 4 2 1 and the addition.
3. Prefix /n → Network bits = n, Host bits = 32−n. Show the bit split.
4. Build the subnet mask: n ones then (32−n) zeros, then dotted decimal.
5. Network address = IP AND Mask. Write IP, Mask, and AND on three lines in binary.
6. Broadcast (host bits all 1) and wildcard.
7. Explain 2^n − 2 where n = host bits: total addresses 2^n, subtract Network and Broadcast. If /31 or /32, explain why 2^n − 2 is NOT used.
8. First host and last host.

OSI and TCP/IP — ALWAYS include the selected layer and the mapping between models:
- Exact function of the layer
- Data unit name (Bits, Frames, Packets, Segments/Datagrams, Data)
- Encapsulation: which header is added going down the stack
- Hardware (router, switch, hub, NIC, cables)
- Standard protocols WITH port numbers (HTTP 80, HTTPS 443, DNS 53, SMTP 25/587, IMAP 143/993, FTP 21, SSH 22, DHCP 67/68)
- Real-world analogy of sending a physical letter (message, envelope, post office, street delivery, truck)

Use numbered steps, short sentences, and **bold** for key ICT terms.
Keep protocol names, IP addresses, bit strings, and formulas in English/digits.`;

const ALLOWED_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
] as const;
const MAX_EXPRESSION_LENGTH = 2000;
const MAX_TRUTH_ROWS = 4096;

type ExplainBody = {
  topic?: unknown;
  expression?: unknown;
  simplifiedExpression?: unknown;
  truthTable?: unknown;
  cidr?: unknown;
  subnet?: unknown;
  layerId?: unknown;
  layerName?: unknown;
  lesson?: unknown;
};

type TruthTablePayload = {
  headers?: unknown;
  matrix?: unknown;
  variables?: unknown;
};

type GeminiClient = InstanceType<typeof GoogleGenAI>;

export async function POST(request: Request) {
  try {
    return await handleExplain(request);
  } catch (error) {
    logExplainError("unhandled POST failure", error);
    const mapped = mapGeminiError(error);
    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status: mapped.status },
    );
  }
}

async function handleExplain(request: Request) {
  const loadedKey = getGeminiApiKey();
  if (loadedKey) {
    process.env.GEMINI_API_KEY = loadedKey;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  console.log(
    "GEMINI_API_KEY Status:",
    process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING",
  );
  if (!apiKey) {
    console.error(
      "[explain] GEMINI_API_KEY is missing or empty. Expected frontend/.env.local.",
    );
    return NextResponse.json(
      { error: MISSING_GEMINI_KEY_MESSAGE, code: "MISSING_GEMINI_KEY" },
      { status: 503 },
    );
  }

  let body: ExplainBody;
  try {
    body = (await request.json()) as ExplainBody;
  } catch (error) {
    logExplainError("invalid JSON body", error);
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.topic === "network") {
    return handleNetworkExplain(body, apiKey);
  }

  const expression = readText(body.expression, "expression");
  const simplifiedExpression = readText(
    body.simplifiedExpression,
    "simplifiedExpression",
  );
  if (expression instanceof NextResponse) {
    return expression;
  }
  if (simplifiedExpression instanceof NextResponse) {
    return simplifiedExpression;
  }

  const tableText = formatTruthTable(body.truthTable);
  if (tableText instanceof NextResponse) {
    return tableText;
  }

  const model = resolveGeminiModel();
  const userContext = [
    "Original Boolean expression:",
    expression,
    "",
    "Simplified expression:",
    simplifiedExpression,
    "",
    "Truth table:",
    tableText,
  ].join("\n");

  return runGemini(apiKey, model, TEACHER_PROMPT, userContext);
}

async function handleNetworkExplain(body: ExplainBody, apiKey: string) {
  const cidr = readText(body.cidr, "cidr");
  if (cidr instanceof NextResponse) {
    return cidr;
  }

  let subnetJson = "";
  if (body.subnet && typeof body.subnet === "object") {
    try {
      subnetJson = JSON.stringify(body.subnet).slice(0, 4000);
    } catch {
      subnetJson = "";
    }
  }

  const layerId = typeof body.layerId === "string" ? body.layerId.slice(0, 40) : "";
  const layerName = typeof body.layerName === "string" ? body.layerName.slice(0, 80) : "";
  const lesson =
    typeof body.lesson === "string" ? body.lesson.slice(0, 12000) : "";

  const userContext = [
    "Topic: IPv4 subnetting and OSI vs TCP/IP for A/L ICT.",
    `CIDR: ${cidr}`,
    subnetJson ? `Computed subnet values (JSON):\n${subnetJson}` : "",
    layerId ? `Selected layer id: ${layerId}` : "Selected layer: none (explain OSI vs TCP/IP mapping generally).",
    layerName ? `Selected layer name: ${layerName}` : "",
    lesson ? `Teacher notes to follow and expand:\n${lesson}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return runGemini(apiKey, resolveGeminiModel(), NETWORK_TEACHER_PROMPT, userContext);
}

async function runGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  userContext: string,
) {

  let ai: GeminiClient;
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (error) {
    logExplainError("GoogleGenAI initialization failed", error);
    const mapped = mapGeminiError(error);
    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status: mapped.status },
    );
  }

  try {
    const result = await generateWithFallback(
      ai,
      model,
      userContext,
      systemInstruction,
    );
    if (result.mode === "sync") {
      return new Response(result.text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Gemini-Mode": "sync",
          "X-Gemini-Model": result.model,
        },
      });
    }

    return streamGeminiResponse(result.iterator, result.firstText, result.model);
  } catch (error) {
    logExplainError("Gemini generate failed after stream and non-stream attempts", error);
    const mapped = mapGeminiError(error);
    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status: mapped.status },
    );
  }
}

function resolveGeminiModel(): string {
  const requested = getGeminiModel().trim();
  if ((ALLOWED_MODELS as readonly string[]).includes(requested)) {
    return requested;
  }
  if (requested) {
    console.error(
      `[explain] Ignoring unsupported GEMINI_MODEL="${requested}". Using gemini-3.6-flash.`,
    );
  }
  return "gemini-3.6-flash";
}

async function generateWithFallback(
  ai: GeminiClient,
  preferredModel: string,
  userContext: string,
  systemInstruction: string,
) {
  const models = [preferredModel, ...ALLOWED_MODELS.filter((item) => item !== preferredModel)];
  let lastError: unknown;

  for (const model of models) {
    const params = {
      model,
      contents: userContext,
      config: {
        systemInstruction,
        temperature: 0.35,
      },
    };

    try {
      const stream = await ai.models.generateContentStream(params);
      const iterator = stream[Symbol.asyncIterator]();
      const first = await iterator.next();
      const firstText = extractChunkText(first.value);
      if (!first.done || firstText) {
        console.log(`[explain] streaming with ${model}`);
        return {
          mode: "stream" as const,
          model,
          iterator,
          firstText,
        };
      }
      console.error(`[explain] ${model} stream was empty; trying non-stream`);
    } catch (error) {
      lastError = error;
      logExplainError(`${model} generateContentStream failed`, error);
    }

    try {
      const response = await ai.models.generateContent(params);
      const text = typeof response.text === "string" ? response.text.trim() : "";
      if (text) {
        console.log(`[explain] non-stream fallback succeeded with ${model}`);
        return { mode: "sync" as const, model, text };
      }
      lastError = new Error(`${model} returned an empty non-streaming response.`);
      console.error(`[explain] ${lastError.message}`);
    } catch (error) {
      lastError = error;
      logExplainError(`${model} generateContent failed`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed.");
}

function streamGeminiResponse(
  iterator: AsyncIterator<unknown>,
  firstText: string,
  model: string,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
          return true;
        } catch {
          return false;
        }
      };

      try {
        if (firstText && !enqueue(firstText)) {
          return;
        }
        while (true) {
          const next = await iterator.next();
          if (next.done) {
            break;
          }
          const text = extractChunkText(next.value);
          if (text && !enqueue(text)) {
            return;
          }
        }
        controller.close();
      } catch (error) {
        const alreadyClosed =
          error instanceof TypeError &&
          String((error as Error).message).includes("already closed");
        if (alreadyClosed) {
          return;
        }
        logExplainError("stream consumption failed", error);
        const mapped = mapGeminiError(error);
        enqueue(`\n\n[දෝෂයක් ඇති විය: ${mapped.message}]`);
        try {
          controller.close();
        } catch {
          // Client already disconnected.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Gemini-Mode": "stream",
      "X-Gemini-Model": model,
    },
  });
}

function logExplainError(stage: string, error: unknown) {
  console.error(`[explain] ${stage}`);
  console.error(error);
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    console.error("[explain] details", {
      name: record.name,
      message: record.message,
      status: record.status,
      code: record.code,
      statusText: record.statusText,
    });
  }
}

function mapGeminiError(error: unknown): {
  message: string;
  code: string;
  status: number;
} {
  const raw = error instanceof Error ? error.message : "Gemini request failed.";
  const lower = raw.toLowerCase();

  if (
    lower.includes("api key") ||
    lower.includes("unauthenticated") ||
    lower.includes("permission_denied") ||
    lower.includes("unauthorized")
  ) {
    return {
      message:
        "Gemini rejected the API key. Check GEMINI_API_KEY in frontend/.env.local and try again.",
      code: "INVALID_GEMINI_KEY",
      status: 401,
    };
  }

  if (lower.includes("not found") || lower.includes("is not supported")) {
    return {
      message:
        "That Gemini model is unavailable. Use GEMINI_MODEL=gemini-3.6-flash.",
      code: "GEMINI_MODEL_UNAVAILABLE",
      status: 502,
    };
  }

  return {
    message: raw,
    code: "GEMINI_REQUEST_FAILED",
    status: 502,
  };
}

function readText(value: unknown, field: string): string | NextResponse {
  if (typeof value !== "string" || !value.trim()) {
    return NextResponse.json(
      { error: `${field} must be a non-empty string.` },
      { status: 400 },
    );
  }
  if (value.length > MAX_EXPRESSION_LENGTH) {
    return NextResponse.json(
      { error: `${field} exceeds the ${MAX_EXPRESSION_LENGTH}-character limit.` },
      { status: 400 },
    );
  }
  return value.trim();
}

function formatTruthTable(value: unknown): string | NextResponse {
  if (!value || typeof value !== "object") {
    return NextResponse.json(
      { error: "truthTable is required." },
      { status: 400 },
    );
  }

  const table = value as TruthTablePayload;
  const headers = Array.isArray(table.headers)
    ? table.headers.filter((header): header is string => typeof header === "string")
    : [];
  const matrix = Array.isArray(table.matrix) ? table.matrix : [];

  if (headers.length === 0 || matrix.length === 0) {
    return NextResponse.json(
      { error: "truthTable must include headers and matrix." },
      { status: 400 },
    );
  }
  if (matrix.length > MAX_TRUTH_ROWS) {
    return NextResponse.json(
      { error: "truthTable has too many rows." },
      { status: 400 },
    );
  }

  const lines = [headers.join(" | ")];
  for (const row of matrix) {
    if (!Array.isArray(row)) {
      continue;
    }
    lines.push(
      row
        .map((cell) => (typeof cell === "number" ? String(cell) : "0"))
        .join(" | "),
    );
  }
  return lines.join("\n");
}

function extractChunkText(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") {
    return "";
  }
  const record = chunk as { text?: unknown };
  return typeof record.text === "string" ? record.text : "";
}
