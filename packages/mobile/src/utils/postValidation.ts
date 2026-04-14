export function validatePost(
  text: string,
  mediaCount = 0,
): { ok: boolean; trimmed: string } {
  const trimmed = text.trim();
  if (trimmed.length === 0 && mediaCount === 0) return { ok: false, trimmed };
  return { ok: true, trimmed };
}
