/**
 * Client-side XSS sanitization utility
 * Uses DOMPurify for defense in depth
 */
import DOMPurify from 'dompurify';

// Sanitize HTML string (strips all tags)
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// Sanitize allowing basic formatting (bold, italic, links)
export function sanitizeRich(str) {
  if (typeof str !== 'string') return str;
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

// Truncate + sanitize for previews
export function sanitizePreview(str, maxLen = 100) {
  if (typeof str !== 'string') return '';
  const clean = DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
  return clean.length > maxLen ? clean.substring(0, maxLen) + '...' : clean;
}

// Sanitize input before sending to API
export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 5000);
}
