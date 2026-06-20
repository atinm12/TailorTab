import { BACKEND_URL, backendHeaders } from "../backend";
import type { GenericRequest, WidgetConfig } from "../types/widget";

interface RawIntent {
  type?: unknown;
  title?: unknown;
  params?: Record<string, unknown>;
}

function newId(): string {
  return crypto.randomUUID();
}

function unsupported(prompt: string, title?: string, reason?: string): WidgetConfig {
  return {
    id: newId(),
    type: "unsupported",
    title: title || prompt.slice(0, 60),
    createdAt: Date.now(),
    params: { originalPrompt: prompt, reason },
  };
}

/** Validate backend output and convert it into a WidgetConfig; null if invalid. */
function toWidgetConfig(raw: RawIntent, prompt: string): WidgetConfig | null {
  const title = typeof raw.title === "string" && raw.title ? raw.title : prompt.slice(0, 60);
  const p = raw.params ?? {};
  const base = { id: newId(), title, createdAt: Date.now() };

  switch (raw.type) {
    case "news":
      if (typeof p.query !== "string" || !p.query) return null;
      return { ...base, type: "news", params: { query: p.query } };
    case "stocks": {
      // Accept the new symbols[] shape, with a fallback for a single "symbol".
      const raw = Array.isArray(p.symbols)
        ? p.symbols
        : typeof p.symbol === "string"
          ? [p.symbol]
          : [];
      const symbols = raw
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.toUpperCase().trim());
      if (symbols.length === 0) return null;
      const range = p.range === "1W" || p.range === "1M" ? p.range : "1D";
      return { ...base, type: "stocks", params: { symbols, range } };
    }
    case "weather":
      if (typeof p.location !== "string" || !p.location) return null;
      return { ...base, type: "weather", params: { location: p.location } };
    case "sports": {
      if (typeof p.sport !== "string" || typeof p.league !== "string") return null;
      const team = typeof p.team === "string" && p.team ? p.team.toLowerCase() : undefined;
      const mode = p.mode === "team" && team ? "team" : "scoreboard";
      return { ...base, type: "sports", params: { sport: p.sport, league: p.league, team, mode } };
    }
    case "generic": {
      const req = p.request as Partial<GenericRequest> | undefined;
      if (!req || typeof req.url !== "string" || !/^https:\/\//i.test(req.url)) return null;
      const headers =
        req.headers && typeof req.headers === "object"
          ? (req.headers as Record<string, string>)
          : undefined;
      const needsKey = typeof req.needsKey === "string" && req.needsKey ? req.needsKey : undefined;
      const sourceName = typeof p.sourceName === "string" ? p.sourceName : undefined;
      return {
        ...base,
        type: "generic",
        params: {
          sourceName,
          request: { url: req.url, method: "GET", headers, needsKey },
          mapping: null,
        },
      };
    }
    case "unsupported":
      return unsupported(prompt, title);
    default:
      return null;
  }
}

const MAX_WIDGETS = 8;

/**
 * Parse a natural-language prompt into one or more WidgetConfigs via the backend
 * (which holds the OpenAI key and rate-limits per device). A compound prompt
 * ("tesla news and the world cup schedule") yields multiple. Never throws: any
 * failure yields a single "unsupported" placeholder so the UI always renders.
 */
export async function parsePrompt(prompt: string, keyNames: string[] = []): Promise<WidgetConfig[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/parse`, {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify({ prompt, keyNames }),
    });
    const data = (await res.json()) as { widgets?: RawIntent[]; error?: string };
    if (!res.ok) throw new Error(data.error || `Parser failed (${res.status})`);

    const raws = Array.isArray(data.widgets) ? data.widgets.slice(0, MAX_WIDGETS) : [];
    const configs = raws
      .map((raw) => toWidgetConfig(raw, prompt))
      .filter((c): c is WidgetConfig => c !== null);

    if (configs.length === 0) {
      if (typeof pendo !== "undefined") {
        pendo.track("prompt_parse_failed", {
          prompt: prompt.slice(0, 200),
          errorMessage: "Couldn't interpret that — try rephrasing it.",
        });
      }
      return [unsupported(prompt, undefined, "Couldn't interpret that — try rephrasing it.")];
    }
    return configs;
  } catch (err) {
    console.error("Prompt parsing failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (typeof pendo !== "undefined") {
      pendo.track("prompt_parse_failed", {
        prompt: prompt.slice(0, 200),
        errorMessage: message.slice(0, 200),
      });
    }
    return [unsupported(prompt, undefined, message)];
  }
}
