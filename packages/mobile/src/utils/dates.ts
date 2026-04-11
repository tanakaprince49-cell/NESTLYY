// Local-date helpers shared by LMP/baby-birth setup, Growth fetal view, and
// any future screen that persists or compares YYYY-MM-DD calendar strings.
//
// Why not `toISOString().slice(0, 10)`?
// Because toISOString() converts to UTC first. In positive offsets such as
// Zimbabwe (UTC+2) a Date constructed near local midnight can shift back by
// up to two hours, so a picker touched at 23:30 persists the previous day.
// Parsing those strings with `new Date(str)` then interprets them as UTC
// midnight, which further shifts the perceived day by another offset.
//
// These helpers operate purely on local calendar parts so a round-trip
// through them is stable regardless of the device timezone.

/** Format a Date as YYYY-MM-DD using local timezone parts. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string back to a local-midnight Date, or null if the
 * string is not a complete, real calendar date. Rejects partials such as
 * "2024" (which `new Date()` would silently accept as 2024-01-01) and
 * invalid days such as Feb 30 (which `new Date()` would roll over to
 * March 2).
 */
export function parseLocalIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return null;
  }
  return parsed;
}

/**
 * Type guard that narrows an optional date string to a real, parseable
 * YYYY-MM-DD. Used by screens that want to branch on "does the profile have
 * a usable LMP date" without crashing `getWeeksAndDays` on NaN.
 */
export function hasValidLmpDate(lmpDate: string | undefined | null): lmpDate is string {
  if (!lmpDate) return false;
  const parsed = new Date(lmpDate).getTime();
  return Number.isFinite(parsed);
}
