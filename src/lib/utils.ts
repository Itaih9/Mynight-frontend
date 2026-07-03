import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
