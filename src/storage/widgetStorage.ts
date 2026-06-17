import type { WidgetConfig } from "../types/widget";

const STORAGE_KEY = "smart-homepage.widgets.v1";

// Upgrade configs saved under an older schema so the current code can render
// them without crashing on now-missing fields.
function migrate(w: WidgetConfig): WidgetConfig {
  if (w.type === "stocks") {
    const p = w.params as { symbols?: string[]; symbol?: string; range?: string };
    if (!Array.isArray(p.symbols)) {
      return {
        ...w,
        params: {
          symbols: p.symbol ? [p.symbol] : [],
          range: p.range === "1W" || p.range === "1M" ? p.range : "1D",
        },
      };
    }
  }
  return w;
}

export function loadWidgets(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (w): w is WidgetConfig =>
          w && typeof w === "object" && typeof w.id === "string" && typeof w.type === "string",
      )
      .map(migrate);
  } catch {
    return [];
  }
}

export function saveWidgets(widgets: WidgetConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}
