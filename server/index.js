import express from 'express';
import cors from 'cors';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Health check FIRST
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

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
