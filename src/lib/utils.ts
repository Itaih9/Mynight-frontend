import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Read the `scope` claim from a JWT (client-side, no verification). Phone-login
 * tokens carry scope: 'gallery' so the app can keep them out of the
 * event-management page while still allowing full gallery capabilities.
 */
export function getTokenScope(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    return typeof payload?.scope === 'string' ? payload.scope : null;
  } catch {
    return null;
  }
}

/**
 * Format a stored category (already-normalized Hebrew folder name) for display.
 * Keeps only the words: strips leading/trailing digits/dashes/underscores and
 * collapses remaining separators to single spaces ("01-חופה" -> "חופה",
 * "03_כיסא כלה" -> "כיסא כלה"). MUST stay in sync with the backend's
 * normalizeCategory so stored and displayed values match. No translation or
 * capitalization — the folder names are already the labels.
 */
export function formatCategoryLabel(category: string): string {
  return category
    .replace(/^[\d._\-\s]+/, '')
    .replace(/[\d._\-\s]+$/, '')
    .replace(/[._\-\s]+/g, ' ')
    .trim();
}
