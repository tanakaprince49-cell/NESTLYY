/**
 * Format a video length (whole seconds) as `m:ss` for clips under 10 minutes
 * and `mm:ss` for longer ones. Returns null for invalid or non-positive
 * inputs so callers can render nothing instead of "0:00".
 */
export function formatDuration(seconds: number | undefined | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.floor(seconds);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  const ssPad = ss.toString().padStart(2, '0');
  if (mm >= 10) return `${mm.toString().padStart(2, '0')}:${ssPad}`;
  return `${mm}:${ssPad}`;
}
