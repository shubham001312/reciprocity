/**
 * Input sanitization utility for XSS prevention
 * Strips HTML tags and encodes dangerous characters
 * Defense in depth — server-side sanitization + client-side DOMPurify
 */

// Strip HTML tags, encode special chars, trim whitespace
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '')           // Remove all HTML tags
    .replace(/&/g, '&amp;')            // Encode &
    .replace(/</g, '&lt;')             // Encode <
    .replace(/>/g, '&gt;')             // Encode >
    .replace(/"/g, '&quot;')           // Encode "
    .replace(/'/g, '&#x27;')           // Encode '
    .replace(/\//g, '&#x2F;')          // Encode /
    .trim();
}

// Lighter sanitizer — just strip tags, no encoding (for display contexts)
function stripTags(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

// Sanitize a single field
function sanitizeField(value) {
  if (typeof value === 'string') return stripHtml(value);
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? stripHtml(v) : v);
  return value;
}

// Sanitize specific fields in an object
function sanitizeFields(obj, fields) {
  if (!obj || !fields) return obj;
  const sanitized = { ...obj };
  for (const field of fields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = sanitizeField(sanitized[field]);
    }
  }
  return sanitized;
}

// Sanitize common text fields in request body
function sanitizeBody(fields) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      if (fields) {
        req.body = sanitizeFields(req.body, fields);
      } else {
        // Auto-sanitize common text fields
        const textFields = ['title', 'content', 'topic', 'name', 'description',
          'collegeName', 'collegeCode', 'message', 'note', 'remark'];
        for (const field of textFields) {
          if (req.body[field] !== undefined) {
            req.body[field] = sanitizeField(req.body[field]);
          }
        }
        // Sanitize arrays of strings (like topicsCovered)
        for (const [key, val] of Object.entries(req.body)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
            req.body[key] = val.map(v => stripHtml(v));
          }
        }
      }
    }
    next();
  };
}

// Max length validator
function maxLength(max) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const [key, val] of Object.entries(req.body)) {
        if (typeof val === 'string' && val.length > max) {
          return res.status(400).json({ error: `${key} must be ${max} characters or less` });
        }
      }
    }
    next();
  };
}

export { stripHtml, stripTags, sanitizeField, sanitizeFields, sanitizeBody, maxLength };
