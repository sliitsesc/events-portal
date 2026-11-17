/**
 * Returns `next` only if it is a same-origin relative path.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.com`) and
 * backslash tricks (`/\evil.com`), falling back to `fallback`.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n\t]/.test(next)) return fallback;
  return next;
}
