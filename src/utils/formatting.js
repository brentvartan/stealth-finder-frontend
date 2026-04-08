// Shared formatting utilities

const YEAR_PREFIX_RE = /^\d{4}\s*(Theme:?\s*)?/i;

/**
 * Strip leading year prefixes like "2026 Theme: " or "2026 " from theme strings.
 * Handles AI responses that include the year even when asked not to.
 */
export function stripYearPrefix(theme) {
  if (!theme) return theme;
  return theme.replace(YEAR_PREFIX_RE, '').trim();
}
