import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { connectDB } from './utils/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import subjectRoutes from './routes/subjects.js';
import classRoutes from './routes/classes.js';
import attendanceRoutes from './routes/attendance.js';
import noteRoutes from './routes/notes.js';
import questionRoutes from './routes/questions.js';
import marksRoutes from './routes/marks.js';
import analyticsRoutes from './routes/analytics.js';
import syllabusRoutes from './routes/syllabus.js';
import reportRoutes from './routes/reports.js';
import pdfReportRoutes from './routes/pdf-reports.js';
import attendanceExportRoutes from './routes/attendance-export.js';
import rankingsRoutes from './routes/rankings-enhanced.js';
import collegesRoutes from './routes/colleges.js';
import designationsRoutes from './routes/designations.js';
import profilesRoutes from './routes/profiles.js';
import collegeRegisterRoutes from './routes/college-register.js';
import noticesRoutes from './routes/notices.js';
import messagesRoutes from './routes/messages.js';
import { auditMiddleware, getAuditLogs, auditLog, AUDIT } from './utils/audit.js';
import { authenticate, authorize } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const isProd = process.env.NODE_ENV === 'production';

// HTTPS enforcement (Render handles TLS termination, so we trust X-Forwarded-Proto)
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.path.startsWith('/api/health')) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Strict CSP — allows only our domain, inline styles for Tailwind, Google Fonts
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'", 'https://reciprocity.vjwfnkp.mongodb.net'],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: isProd ? [] : null,
};

app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  frameguard: { action: 'sameorigin' },
}));

app.use(cors({
  origin: isProd ? ['https://reciprocity-live.onrender.com'] : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting: 200 requests per 15 min per IP (general)
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please try again later' } });
app.use('/api/', generalLimiter);

// Stricter: 10 attempts per 15 min for auth (login/signup)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts, please wait 15 minutes' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Audit logging middleware (after auth, before routes)
app.use(auditMiddleware);

// Health check FIRST
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Audit logs endpoint (admin only)
app.get('/api/audit-logs', authenticate, authorize('admin'), async (req, res) => {
  const { limit = 50, filter } = req.query;
  const logs = await getAuditLogs(parseInt(limit) || 50, filter || null);
  res.json(logs);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reports', pdfReportRoutes);
app.use('/api/attendance-export', attendanceExportRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/colleges', collegesRoutes);
app.use('/api/designations', designationsRoutes);
app.use('/api/profile', profilesRoutes);
app.use('/api/college-register', collegeRegisterRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/messages', messagesRoutes);

// Global error handler — prevents internal details from leaking
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static frontend build — AFTER all API routes
const clientDist = join(__dirname, '..', 'client', 'dist');
const indexPath = join(clientDist, 'index.html');

// Serve static assets (JS, CSS, images)
app.use(express.static(clientDist, { index: false }));

// SPA catch-all: any non-API GET that didn't match a static file → index.html
app.get('*', (req, res) => {
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).json({ error: 'Frontend build not found. Run: cd client && npm run build' });
  }
});

// Start server after MongoDB connection
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n  ╔═══════════════════════════════════════╗`);
      console.log(`  ║  RECIPROCITY Server                   ║`);
      console.log(`  ║  Running on http://localhost:${PORT}      ║`);
      console.log(`  ╚═══════════════════════════════════════╝\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
