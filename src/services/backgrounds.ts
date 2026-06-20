import type { ProfileId } from "./presets";

// A shared pool of backgrounds applied across all profiles. Pressing "change
// background" rotates to a different one of these. To restore the per-profile
// themed pools, see the earlier version in git history.
const BACKGROUNDS = [
  "/backgrounds/city.jpg",
  "/backgrounds/beach.jpg",
  "/backgrounds/forest-rain.jpg",
  "/backgrounds/lion.jpg",
  "/backgrounds/stones.jpg",
];

/**
 * Returns a background for the dashboard, picked from the shared pool. When an
 * `exclude` URL is given (the current background), the result is guaranteed to
 * differ so pressing "change background" always visibly changes the image.
 */
export function randomBackground(_profile: ProfileId, exclude?: string): string {
  const pool = exclude ? BACKGROUNDS.filter((b) => b !== exclude) : BACKGROUNDS;
  const choices = pool.length > 0 ? pool : BACKGROUNDS;
  return choices[Math.floor(Math.random() * choices.length)];
}
