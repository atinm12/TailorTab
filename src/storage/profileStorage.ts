import type { ProfileId } from "../services/presets";
import type { WidgetConfig } from "../types/widget";

const ACTIVE_KEY = "smart-homepage.activeProfile.v1";
const PROFILE_WIDGETS_KEY = "smart-homepage.profileWidgets.v1";
const CITY_KEY = "smart-homepage.localCity.v1";
const LEGACY_WIDGETS_KEY = "smart-homepage.widgets.v1";

const VALID_IDS: ProfileId[] = [
  "finance",
  "athlete",
  "techie",
  "minimalist",
  "entrepreneur",
  "politician",
  "newspaper",
  "local",
  "custom",
];

export type ProfileWidgets = Partial<Record<ProfileId, WidgetConfig[]>>;

export function loadActiveProfile(): ProfileId | null {
  const raw = localStorage.getItem(ACTIVE_KEY);
  return raw && (VALID_IDS as string[]).includes(raw) ? (raw as ProfileId) : null;
}

export function saveActiveProfile(id: ProfileId): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function loadProfileWidgets(): ProfileWidgets {
  try {
    const raw = localStorage.getItem(PROFILE_WIDGETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as ProfileWidgets;
    }
  } catch {
    /* fall through */
  }

  // One-time migration: fold any pre-profiles widgets into the Custom profile.
  try {
    const legacy = localStorage.getItem(LEGACY_WIDGETS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { custom: parsed as WidgetConfig[] };
      }
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function saveProfileWidgets(map: ProfileWidgets): void {
  localStorage.setItem(PROFILE_WIDGETS_KEY, JSON.stringify(map));
}

export function loadLocalCity(): string {
  return localStorage.getItem(CITY_KEY) ?? "";
}

export function saveLocalCity(city: string): void {
  localStorage.setItem(CITY_KEY, city);
}
