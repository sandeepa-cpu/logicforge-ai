import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DEFAULT_MODEL = "gemini-3.6-flash";
const ALLOWED_MODELS = new Set([
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
]);

function envDirectories(): string[] {
  const cwd = process.cwd();
  return [...new Set([cwd, join(cwd, "frontend"), resolve(cwd, "..")])];
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseDotEnv(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match?.[1]) {
      continue;
    }
    let value = match[2] ?? "";
    if (!/^[`'"]/.test(value)) {
      value = value.replace(/\s+#.*$/, "");
    }
    parsed[match[1]] = stripQuotes(value);
  }
  return parsed;
}

function readEnvValue(name: string): string {
  for (const directory of envDirectories()) {
    for (const filename of [".env.local", ".env.development.local", ".env"]) {
      const filePath = join(directory, filename);
      if (!existsSync(filePath) || filename.includes("example")) {
        continue;
      }
      const value = parseDotEnv(readFileSync(filePath, "utf8"))[name];
      if (value) {
        process.env[name] = value;
        return value;
      }
    }
  }
  return stripQuotes(process.env[name] ?? "");
}

export function getGeminiApiKey(): string {
  return readEnvValue("GEMINI_API_KEY");
}

export function getGeminiModel(): string {
  const requested = readEnvValue("GEMINI_MODEL");
  if (ALLOWED_MODELS.has(requested)) {
    return requested;
  }
  return DEFAULT_MODEL;
}

export const MISSING_GEMINI_KEY_MESSAGE =
  "Gemini API key is missing. Create frontend/.env.local (next to package.json), add GEMINI_API_KEY=your_key, save, then restart npm run dev. Do not use NEXT_PUBLIC_.";
