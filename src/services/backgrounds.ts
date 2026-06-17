import type { ProfileId } from "./presets";

// Wallpapers bundled in public/backgrounds/ (keyless, ship inside the extension).
// To use your own photos, drop image files in that folder and list them here.
const FILES = ["midnight", "forest", "violet", "sunset", "slate", "aurora"];

const path = (name: string) => `/backgrounds/${name}.svg`;
const ALL = FILES.map(path);

// Per-profile preferred wallpapers (each profile rotates among these).
const THEME: Record<ProfileId, string[]> = {
  finance: ["midnight", "slate", "violet"],
  athlete: ["forest", "aurora", "midnight"],
  techie: ["violet", "midnight", "aurora"],
  minimalist: ["forest", "slate", "aurora"],
  entrepreneur: ["sunset", "violet", "midnight"],
  politician: ["midnight", "slate", "sunset"],
  newspaper: ["slate", "midnight", "violet"],
  local: ["aurora", "forest", "sunset"],
  custom: ["aurora", "violet", "sunset", "forest"],
};

/** Pick a random bundled wallpaper for a profile, avoiding an immediate repeat. */
export function randomBackground(profile: ProfileId, exclude?: string): string {
  const pool = (THEME[profile] ?? FILES).map(path);
  const choices = pool.length > 1 && exclude ? pool.filter((p) => p !== exclude) : pool;
  return choices[Math.floor(Math.random() * choices.length)] ?? ALL[0];
}
