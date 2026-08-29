/**
 * Audit logging module for RECIPROCITY
 * Logs security events, admin actions, and sensitive operations
 * Stores in audit-logs.json (JSON storage) or MongoDB 'audit_logs' collection
 */
import { col } from './db.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Event categories
export const AUDIT = {
  // Auth events
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGIN_RATE_LIMITED: 'auth.login.rate_limited',
  SIGNUP: 'auth.signup',
  PASSWORD_CHANGE: 'auth.password_change',
  LOGOUT: 'auth.logout',
  TOKEN_EXPIRED: 'auth.token_expired',
  UNAUTHORIZED_ACCESS: 'auth.unauthorized',

  // Admin actions
  USER_CREATED: 'admin.user_created',
  USER_DELETED: 'admin.user_deleted',
  CLASS_CREATED: 'admin.class_created',
  CLASS_DELETED: 'admin.class_deleted',
  NOTICE_CREATED: 'admin.notice_created',
  NOTICE_DELETED: 'admin.notice_deleted',
  DESIGNATION_APPROVED: 'admin.designation_approved',
  DESIGNATION_REJECTED: 'admin.designation_rejected',
  COLLEGE_REGISTERED: 'admin.college_registered',
  MARKS_ENTERED: 'admin.marks_entered',

  // Student/Professor actions
  ATTENDANCE_MARKED: 'action.attendance_marked',
  ATTENDANCE_CONFIRMED: 'action.attendance_confirmed',
  MESSAGE_SENT: 'action.message_sent',
  FILE_DOWNLOADED: 'action.file_downloaded',

  // Security events
  SUSPICIOUS_INPUT: 'security.suspicious_input',
  RATE_LIMIT_HIT: 'security.rate_limit_hit',
  INVALID_TOKEN: 'security.invalid_token',
  CORS_BLOCKED: 'security.cors_blocked',
};

// In-memory buffer (flushes every 5 seconds or when buffer reaches 50)
let buffer = [];
const FLUSH_INTERVAL = 5000;
const BUFFER_LIMIT = 50;

/**
 * Log an audit event
 * @param {string} event - Event type from AUDIT constants
 * @param {object} details - Event-specific details
 * @param {object} context - Request context (user, IP, etc.)
 */
export function auditLog(event, details = {}, context = {}) {
  const entry = {
    _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    event,
    timestamp: new Date().toISOString(),
    userId: context.userId || context.user?.id || null,
    userRole: context.userRole || context.user?.role || null,
    userName: context.userName || context.user?.name || null,
    ip: context.ip || context.req?.ip || context.req?.connection?.remoteAddress || 'unknown',
    userAgent: context.userAgent || context.req?.headers?.['user-agent'] || 'unknown',
    method: context.method || context.req?.method || null,
    path: context.path || context.req?.originalUrl || null,
    statusCode: context.statusCode || null,
    details,
  };

  // Always log to console (visible in Render logs)
  const level = event.includes('failed') || event.includes('security') || event.includes('rate_limited')
    ? '🔴'
    : event.includes('created') || event.includes('success') || event.includes('approved')
    ? '🟢'
    : '🔵';

  console.log(`${level} [AUDIT] ${event} | user=${entry.userId || 'anon'} | ${entry.method || ''} ${entry.path || ''} | ip=${entry.ip}`);

  // Buffer for batch write
  buffer.push(entry);
  if (buffer.length >= BUFFER_LIMIT) {
    flushBuffer();
  }
}

// Flush buffer to storage
async function flushBuffer() {
  if (buffer.length === 0) return;
  const entries = buffer.splice(0, buffer.length);

  try {
    // Try MongoDB first
    if (col('audit_logs') && typeof col('audit_logs').insertMany === 'function') {
      await col('audit_logs').insertMany(entries);
    } else {
      // Fallback to JSON file
      const filePath = join(DATA_DIR, 'audit-logs.json');
      let existing = [];
      if (existsSync(filePath)) {
        try { existing = JSON.parse(readFileSync(filePath, 'utf-8')); } catch { existing = []; }
      }
      existing.push(...entries);
      // Keep only last 5000 entries
      if (existing.length > 5000) existing = existing.slice(-5000);
      writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Audit flush error:', err.message);
  }
}

// Flush on shutdown
process.on('SIGTERM', () => { flushBuffer(); process.exit(0); });
process.on('SIGINT', () => { flushBuffer(); process.exit(0); });

// Auto-flush interval
setInterval(flushBuffer, FLUSH_INTERVAL);

/**
 * Express middleware: auto-log every API request with timing
 */
export function auditMiddleware(req, res, next) {
  const start = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.originalUrl || req.url;

    // Only log API routes, skip static assets and health checks
    if (!path.startsWith('/api/') || path === '/api/health') return;

    // Log slow requests (>2s)
    if (duration > 2000) {
      console.log(`⚠️ [SLOW] ${req.method} ${path} took ${duration}ms`);
    }

    // Log failed requests
    if (res.statusCode >= 400) {
      auditLog(`http.${res.statusCode}`, {
        duration,
        statusCode: res.statusCode,
      }, {
        req,
        userId: req.user?.id,
        userRole: req.user?.role,
      });
    }
  });

  next();
}

/**
 * Get recent audit logs
 * @param {number} limit - Number of entries to return
 * @param {string} filter - Filter by event prefix
 */
export async function getAuditLogs(limit = 50, filter = null) {
  try {
    // Try MongoDB first
    const logsCol = col('audit_logs');
    if (logsCol && typeof logsCol.find === 'function') {
      const filterObj = filter ? { event: { $regex: filter } } : {};
      const all = await logsCol.find(filterObj).sort({ timestamp: -1 }).toArray();
      return all.slice(0, limit);
    }
  } catch {}

  // Fallback to JSON file
  const filePath = join(DATA_DIR, 'audit_logs.json');
  if (!existsSync(filePath)) return [];
  try {
    let logs = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (filter) logs = logs.filter(l => l.event.startsWith(filter));
    return logs.slice(-limit).reverse();
  } catch {
    return [];
  }
}
