import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EXPRESSION_LENGTH = 2000;

export async function POST(request: Request) {
  let body: { expression?: unknown };
  try {
    body = (await request.json()) as { expression?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const expression = typeof body.expression === "string" ? body.expression.trim() : "";
  if (!expression) {
    return NextResponse.json(
      { error: "Expression cannot be empty." },
      { status: 400 },
    );
  }
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    return NextResponse.json(
      { error: `Expression exceeds the ${MAX_EXPRESSION_LENGTH}-character limit.` },
      { status: 400 },
    );
  }

  const backend = (process.env.LOGIC_API_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );

  try {
    const response = await fetch(`${backend}/api/parse-expression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "detail" in payload
          ? String(payload.detail)
          : "Could not parse the Boolean expression.";
      return NextResponse.json({ error: detail }, { status: response.status });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Logic engine is not reachable. Start the FastAPI backend on port 8000." },
      { status: 502 },
    );
  }
}
