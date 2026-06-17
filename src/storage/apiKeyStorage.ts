// User-managed API keys for dynamically-sourced (generic) widgets, keyed by a
// short name the agent references via {{KEY_NAME}} placeholders. Stored
// separately from widgets and from the bundled config.ts keys.
const STORAGE_KEY = "smart-homepage.apikeys.v1";

export type ApiKeys = Record<string, string>;

export function loadApiKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: ApiKeys = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}
