export interface GenFile {
  path: string;
  content: string;
}

export interface GenResult {
  files: GenFile[];
  summary: string;
}

const SYSTEM_PROMPT = `You are KAIROSFORGE, an expert full-stack website generator.
Given a user description and options, return a COMPLETE, WORKING website as a JSON object:
{ "summary": "one sentence about the site", "files": [ { "path": "index.html", "content": "..." }, ... ] }

Rules:
- For "html" mode: produce index.html (linked), styles.css, script.js. All static, no build step.
- For "react" mode: produce App.jsx, components/*.jsx, styles.css, index.html stub is NOT needed. Use plain JSX, no imports from npm packages except react.
- All output must be responsive, professional, and polished. Include real content (headings, nav, sections, footer). No placeholders like TODO.
- Follow the user's requested theme, colors, typography and style precisely.
- Respond with ONLY the JSON object. No markdown fences.`;

interface Options {
  mode?: string;
  category?: string;
  style?: string;
  colors?: string;
  typography?: string;
  responsive?: boolean;
  theme?: string;
}

export async function generateWebsite(prompt: string, options: Options = {}): Promise<GenResult> {
  const provider = process.env.AI_PROVIDER || "openai";
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || (provider === "openai" ? "gpt-4o" : "claude-3-5-sonnet-20241022");

  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured. Set AI_PROVIDER, AI_API_KEY and AI_MODEL in your environment (.env).");
  }

  const userContent = [
    `Website description: ${prompt}`,
    `Mode: ${options.mode || "html"}`,
    options.category ? `Category: ${options.category}` : "",
    options.style ? `Design style: ${options.style}` : "",
    options.colors ? `Colors: ${options.colors}` : "",
    options.typography ? `Typography: ${options.typography}` : "",
    `Responsive: ${options.responsive !== false}`,
    `Theme: ${options.theme || "dark"}`,
  ].filter(Boolean).join("\n");

  const url =
    provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

  const body =
    provider === "openai"
      ? { model, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userContent }], temperature: 0.7 }
      : { model, max_tokens: 8000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userContent }] };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(provider === "openai" ? { Authorization: `Bearer ${apiKey}` } : { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = provider === "openai" ? data.choices?.[0]?.message?.content : data.content?.[0]?.text;
  if (!raw) throw new Error("AI returned no content.");

  let parsed: GenResult;
  try {
    const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned malformed JSON. Try regenerating.");
  }

  if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
    throw new Error("AI returned no files.");
  }
  return parsed;
}

export async function editWebsite(
  currentFiles: GenFile[],
  instruction: string
): Promise<GenResult> {
  const provider = process.env.AI_PROVIDER || "openai";
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || (provider === "openai" ? "gpt-4o" : "claude-3-5-sonnet-20241022");

  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured.");
  }

  const system = `You are KAIROSFORGE's editing assistant. You receive the CURRENT project files and a change instruction.
Return ONLY a JSON object: { "summary": "what you changed", "files": [ { "path": "...", "content": "..." } ] }
Return ONLY the files that need to change. Preserve all existing functionality. Keep all files consistent.

Current files:
${currentFiles.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n")}`;

  const url =
    provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

  const body =
    provider === "openai"
      ? { model, messages: [{ role: "system", content: system }, { role: "user", content: instruction }], temperature: 0.4 }
      : { model, max_tokens: 8000, system, messages: [{ role: "user", content: instruction }] };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(provider === "openai" ? { Authorization: `Bearer ${apiKey}` } : { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = provider === "openai" ? data.choices?.[0]?.message?.content : data.content?.[0]?.text;
  if (!raw) throw new Error("AI returned no content.");

  let parsed: GenResult;
  try {
    const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned malformed JSON.");
  }
  if (!Array.isArray(parsed.files)) throw new Error("AI returned no files.");
  return parsed;
}
