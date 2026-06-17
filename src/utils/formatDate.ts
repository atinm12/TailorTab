// Shared date display rule for all widgets:
//   same calendar day        -> "Today"
//   1-6 calendar days ago    -> "N days ago"
//   a week or more (or future) -> the date, e.g. "Jun 3" / "Jun 3, 2025"

const DAY_MS = 86_400_000;

function parseDate(input: string): Date | null {
  // Date-only strings (e.g. Alpha Vantage's "2026-06-11") parse as UTC midnight,
  // which can land on the previous local day — parse them as local instead.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeDate(input: string): string | null {
  const date = parseDate(input);
  if (!date) return null;

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

  if (diffDays === 0) return "Today";
  if (diffDays > 0 && diffDays < 7) return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

/** Does this string look like an ISO date/datetime an API would return? */
export function isLikelyDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(value);
}

/** Format if the value is a recognizable date; otherwise return it unchanged. */
export function formatIfDate(value: string): string {
  if (!isLikelyDate(value)) return value;
  return formatRelativeDate(value) ?? value;
}
