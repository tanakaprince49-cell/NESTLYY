export function validatePost(text: string): { ok: boolean; trimmed: string } {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, trimmed };
  return { ok: true, trimmed };
}
