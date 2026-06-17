import { Hono } from "hono";
import { cors } from "hono/cors";

export interface Env {
  /** KV namespace for rate-limit counters + response cache. */
  KV: KVNamespace;
  /** OpenAI key — set with `wrangler secret put OPENAI_API_KEY` (never in vars). */
  OPENAI_API_KEY: string;
  /** Optional: restrict to your published extension id, e.g. "abcd...". */
  EXTENSION_ID?: string;
}

const MODEL = "gpt-4o-mini";

// ---- prompts (kept server-side so they can change without an extension update) ----

function parseSystemPrompt(keyNames: string[]): string {
  const keysLine =
    keyNames.length > 0
      ? `The user has saved these API keys you may reference: ${keyNames.join(", ")}. Reference one as a {{NAME}} placeholder in the url or a header, and set "needsKey" to that name.`
      : `The user has saved no API keys. Prefer keyless public APIs. If a source truly needs a key, still emit the request with a {{NAME}} placeholder and set "needsKey" to a sensible NAME — the user will be prompted to add it.`;

  return `You convert a user's dashboard request into one or more widget configs. Respond ONLY with a JSON object of the form:
{ "widgets": [ { "type": ..., "title": ..., "params": ... }, ... ] }

Each widget is:
{ "type": "news" | "stocks" | "sports" | "weather" | "generic" | "unsupported",
  "title": string,
  "params": object }

A single prompt usually maps to ONE widget. If the user asks for several distinct things in one sentence (joined by "and", "&", commas, or "also"), emit ONE widget per distinct request. Do NOT split a single coherent request. Cap at 8 widgets.

params by type:
- news:    { "query": string }   // DEFAULT for any informational / current-events topic with no specific data API: releases, launches, announcements, rumors, reviews, products, culture, people, "what's happening with X". Use news even if the user never says the word "news". query = concise search terms.
- stocks:  { "symbols": string[], "range": "1D"|"1W"|"1M" }  // uppercase tickers; resolve company names (Tesla -> TSLA). Include every ticker listed. range: a day -> "1D", week -> "1W", month -> "1M"; default "1D".
- weather: { "location": string }   // "City" or "City,CountryCode"
- sports:  { "sport": string, "league": string, "team": string|null, "mode": "team"|"scoreboard" }
  ESPN path segments: nfl -> football/nfl, nba -> basketball/nba, mlb -> baseball/mlb, nhl -> hockey/nhl,
  premier league -> soccer/eng.1, mls -> soccer/usa.1, college football -> football/college-football,
  FIFA World Cup -> soccer/fifa.world, champions league -> soccer/uefa.champions, la liga -> soccer/esp.1,
  bundesliga -> soccer/ger.1, serie a -> soccer/ita.1.
  Schedules/scores/fixtures for a league use mode="scoreboard". team is the ESPN abbreviation (Steelers -> "pit").
  If the user names a team, mode="team"; a whole league -> mode="scoreboard", team=null. Any team mention -> sports.
- generic: { "sourceName": string, "request": { "url": string, "method": "GET", "headers"?: object, "needsKey"?: string } }
  Use "generic" ONLY when a SPECIFIC, real public API serves the request (one listed below, or one you are confident exists). NEVER invent, guess, or approximate an API URL. If unsure a real API exists, use "news" instead.
  ${keysLine}
  Prefer these keyless, server-friendly APIs:
    crypto price -> https://api.coinbase.com/v2/prices/<SYMBOL>-USD/spot  (SYMBOL=BTC, ETH, SOL, ...)
    FX rates -> api.frankfurter.dev ; weather by lat/lon -> api.open-meteo.com ;
    GitHub (repos/commits/search) -> api.github.com ; Wikipedia summary -> en.wikipedia.org REST ; restcountries.com.
  Do NOT use CoinGecko — it blocks server requests (returns 403).
  Routing fallback: if a request isn't stocks/sports/weather and has no specific known API, use "news" (NOT generic, NOT unsupported). Reserve "unsupported" ONLY for non-informational actions the dashboard can't perform (e.g. "play me a song", "open my email", "set a reminder").

Examples (each widget object goes inside {"widgets":[ ... ]}):
"tesla news and the world cup schedule" -> {"widgets":[{"type":"news","title":"Tesla","params":{"query":"Tesla"}},{"type":"sports","title":"FIFA World Cup","params":{"sport":"soccer","league":"fifa.world","team":null,"mode":"scoreboard"}}]}
"TSLA stock price" -> {"widgets":[{"type":"stocks","title":"TSLA","params":{"symbols":["TSLA"],"range":"1D"}}]}
"weather in austin" -> {"widgets":[{"type":"weather","title":"Weather in Austin","params":{"location":"Austin,US"}}]}
"price of bitcoin" -> {"widgets":[{"type":"generic","title":"Bitcoin Price","params":{"sourceName":"Coinbase","request":{"url":"https://api.coinbase.com/v2/prices/BTC-USD/spot","method":"GET"}}}]}
"show me recent sneaker releases" -> {"widgets":[{"type":"news","title":"Sneaker Releases","params":{"query":"recent sneaker releases"}}]}
"upcoming sneaker releases" -> {"widgets":[{"type":"news","title":"Upcoming Sneaker Releases","params":{"query":"upcoming sneaker releases"}}]}
"play me a song" -> {"widgets":[{"type":"unsupported","title":"Play Me a Song","params":{"originalPrompt":"play me a song"}}]}`;
}

const SHAPE_SYSTEM_PROMPT = `You are given a user's dashboard request and a JSON sample returned by an API. Produce a mapping that extracts the most relevant data for a compact widget. Respond ONLY with JSON:
{ "rows": [ { "label": string, "path": string } ], "list": { "path": string, "titlePath": string, "subtitlePath"?: string, "urlPath"?: string } | null }
- "path" values are dot/bracket paths INTO the sample, e.g. "bitcoin.usd", "current.temperature_2m", "items[0].full_name", "[0].name".
- Paths in "list" are RELATIVE to each element of the array at list.path.
- Use "rows" for scalar facts; use "list" only when the response has an array worth listing; otherwise list=null.
- Prefer 2-5 rows with human-readable labels. Never invent paths absent from the sample. Include a date/timestamp field when relevant.`;

// ---- OpenAI ----

async function callOpenAI(env: Env, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json.error?.message || `OpenAI failed (${res.status})`);
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty completion");
  return content;
}

// ---- rate limiting (KV-backed; soft caps, fine for this scale) ----

async function underLimit(
  env: Env,
  deviceId: string,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const windowId = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${bucket}:${deviceId}:${windowId}`;
  const current = parseInt((await env.KV.get(key)) ?? "0", 10);
  if (current >= limit) return false;
  await env.KV.put(key, String(current + 1), { expirationTtl: windowSeconds + 60 });
  return true;
}

/** Daily cap + per-minute burst. Returns null if OK, or an error message. */
async function checkLimits(env: Env, deviceId: string, dailyLimit: number): Promise<string | null> {
  if (!(await underLimit(env, deviceId, "burst", 12, 60))) {
    return "Too many requests — slow down a moment.";
  }
  if (!(await underLimit(env, deviceId, "day", dailyLimit, 86400))) {
    return "Daily limit reached — resets tomorrow.";
  }
  return null;
}

// ---- SSRF guard for /fetch ----

function isSafeUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    return false;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }
  if (host.includes(":")) {
    // IPv6 literal — block loopback/link-local/unique-local
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
      return false;
    }
  }
  return true;
}

// ---- app ----

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin) =>
      !origin || origin.startsWith("chrome-extension://") || origin.startsWith("http://localhost")
        ? origin || "*"
        : null,
    allowHeaders: ["Content-Type", "X-Device-Id"],
    allowMethods: ["POST", "OPTIONS"],
    maxAge: 86400,
  }),
);

// Reject requests that aren't from a browser extension (light guard).
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") ?? "";
  const isExt = origin.startsWith("chrome-extension://");
  const isDev = origin.startsWith("http://localhost") || origin === "";
  if (!isExt && !isDev) return c.json({ error: "Forbidden origin" }, 403);
  if (c.env.EXTENSION_ID && isExt && !origin.includes(c.env.EXTENSION_ID)) {
    return c.json({ error: "Forbidden origin" }, 403);
  }
  await next();
});

function deviceId(c: { req: { header: (k: string) => string | undefined } }): string {
  return c.req.header("X-Device-Id") || "anon";
}

app.get("/", (c) => c.json({ ok: true, service: "smart-homepage-api" }));

app.post("/parse", async (c) => {
  const limited = await checkLimits(c.env, deviceId(c), 40);
  if (limited) return c.json({ error: limited }, 429);

  const { prompt, keyNames } = await c.req.json<{ prompt?: string; keyNames?: string[] }>();
  if (typeof prompt !== "string" || !prompt.trim()) return c.json({ error: "Missing prompt" }, 400);
  const names = Array.isArray(keyNames) ? keyNames.filter((n) => typeof n === "string") : [];

  const cacheKey = `cache:parse:v3:${prompt.trim().toLowerCase()}:${names.sort().join(",")}`;
  const cached = await c.env.KV.get(cacheKey);
  if (cached) return c.body(cached, 200, { "Content-Type": "application/json" });

  try {
    const content = await callOpenAI(c.env, parseSystemPrompt(names), prompt);
    await c.env.KV.put(cacheKey, content, { expirationTtl: 3600 });
    return c.body(content, 200, { "Content-Type": "application/json" });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "parse failed" }, 502);
  }
});

app.post("/shape", async (c) => {
  const limited = await checkLimits(c.env, deviceId(c), 40);
  if (limited) return c.json({ error: limited }, 429);

  const { prompt, sample } = await c.req.json<{ prompt?: string; sample?: string }>();
  if (typeof sample !== "string") return c.json({ error: "Missing sample" }, 400);
  const trimmed = sample.length > 4000 ? sample.slice(0, 4000) + "…(truncated)" : sample;

  try {
    const content = await callOpenAI(
      c.env,
      SHAPE_SYSTEM_PROMPT,
      `Request: ${prompt ?? ""}\n\nJSON sample:\n${trimmed}`,
    );
    return c.body(content, 200, { "Content-Type": "application/json" });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "shape failed" }, 502);
  }
});

app.post("/fetch", async (c) => {
  const limited = await checkLimits(c.env, deviceId(c), 800);
  if (limited) return c.json({ error: limited }, 429);

  const { url, headers } = await c.req.json<{ url?: string; headers?: Record<string, string> }>();
  if (typeof url !== "string" || !isSafeUrl(url)) {
    return c.json({ error: "Invalid or disallowed URL" }, 400);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        // A browser-like UA + Accept; some APIs 403 server requests without them.
        "User-Agent": "Mozilla/5.0 (compatible; SmartHomepage/1.0)",
        Accept: "application/json, text/plain, */*",
        ...(headers ?? {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = (await res.text()).slice(0, 250_000); // cap response size
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return c.json({ status: res.status, ok: res.ok, body });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "fetch failed" }, 502);
  }
});

export default app;
