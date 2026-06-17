export type FontScale = "small" | "medium" | "large";

export interface Prefs {
  /** The description used to generate the current background, if any. */
  backgroundPrompt: string | null;
  fontScale: FontScale;
  /** false = 24-hour (military) time */
  hour12: boolean;
  /** "auto" = browser's local zone, otherwise an IANA zone like "America/New_York" */
  timeZone: string;
}

export const DEFAULT_PREFS: Prefs = {
  backgroundPrompt: null,
  fontScale: "medium",
  hour12: true,
  timeZone: "auto",
};

const PREFS_KEY = "smart-homepage.prefs.v1";
// The generated background (a sizable data URL) is stored under its own key so
// prefs reads/writes stay cheap.
const BG_KEY = "smart-homepage.background.v1";

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      backgroundPrompt:
        typeof parsed.backgroundPrompt === "string" ? parsed.backgroundPrompt : null,
      fontScale: ["small", "medium", "large"].includes(parsed.fontScale)
        ? parsed.fontScale
        : "medium",
      hour12: typeof parsed.hour12 === "boolean" ? parsed.hour12 : true,
      timeZone: typeof parsed.timeZone === "string" ? parsed.timeZone : "auto",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadBackgroundImage(): string | null {
  return localStorage.getItem(BG_KEY);
}

export function saveBackgroundImage(dataUrl: string): void {
  localStorage.setItem(BG_KEY, dataUrl);
}

export function clearBackgroundImage(): void {
  localStorage.removeItem(BG_KEY);
}
