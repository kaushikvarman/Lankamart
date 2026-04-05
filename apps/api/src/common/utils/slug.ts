import { randomBytes } from 'crypto';

/**
 * Generates a URL-safe slug from a given string.
 * Handles special characters, converts spaces to hyphens,
 * lowercases everything, and appends a short random suffix
 * to avoid collisions.
 *
 * @param input - The source string (e.g. business name)
 * @returns A URL-safe slug with a random suffix
 *
 * @example
 * generateSlug('Ceylon Spices & Co.') // => 'ceylon-spices-co-a3f1'
 */
export function generateSlug(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric (keep spaces, hyphens)
    .replace(/[\s_]+/g, '-')        // spaces/underscores to hyphens
    .replace(/-+/g, '-')            // collapse consecutive hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens

  const suffix = randomBytes(3).toString('hex'); // 6-char hex suffix

  return base ? `${base}-${suffix}` : suffix;
}
