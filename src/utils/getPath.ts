/**
 * Resolve a dot/bracket path against an arbitrary value.
 * Supports "a.b", "a[0].b", "a.0.b". Returns undefined if any segment misses.
 *   getPath({ bitcoin: { usd: 63607 } }, "bitcoin.usd") === 63607
 *   getPath({ items: [{ name: "x" }] }, "items[0].name") === "x"
 */
export function getPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const segments = path
    .replace(/\[(\w+)\]/g, ".$1") // items[0] -> items.0
    .split(".")
    .filter(Boolean);

  let current: unknown = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

/** Resolve a path and coerce the result to a display string. */
export function getPathString(obj: unknown, path: string): string {
  const value = getPath(obj, path);
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
