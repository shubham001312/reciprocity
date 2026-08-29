import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';
import { auditLog, AUDIT } from '../utils/audit.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { professorId, subjectId, year, semester, section, stream } = req.query;
  const filter = {};
  if (professorId) filter.professorId = professorId;
  if (subjectId) filter.subjectId = subjectId;
  if (year) filter.year = parseInt(year);
  if (semester) filter.semester = parseInt(semester);
  if (section) filter.section = section;
  if (stream) filter.stream = stream;
  if (req.user.role === 'professor') filter.professorId = req.user.id;
  const classes = await col('classes').find(filter).sort({ date: -1 }).toArray();
  res.json(classes);
});

router.get('/filters', authenticate, async (req, res) => {
  const classes = await col('classes').find().toArray();
  const years = [...new Set(classes.map(c => c.year).filter(Boolean))].sort();
  const semesters = [...new Set(classes.map(c => c.semester).filter(Boolean))].sort((a, b) => a - b);
  const sections = [...new Set(classes.map(c => c.section).filter(Boolean))].sort();
  const streams = [...new Set(classes.map(c => c.stream).filter(Boolean))].sort();
  res.json({ years, semesters, sections, streams });
});

router.post('/', authenticate, authorize('professor', 'admin'), async (req, res) => {
  const { subjectId, date, topic, duration, studentsPresent, totalStudents, year, semester, section, stream } = req.body;
  const professorId = req.user.role === 'admin' ? (req.body.professorId || req.user.id) : req.user.id;
  const newClass = {
    _id: `cls-${uuid().substring(0, 8)}`,
    professorId,
    subjectId, date, topic, duration: duration || 55,
    studentsPresent: studentsPresent || 0,
    totalStudents: totalStudents || 46,
    year: year || null,
    semester: semester || null,
    section: section || 'A',
    stream: stream || 'CSE',
    createdAt: new Date().toISOString(),
  };
  await col('classes').insertOne(newClass);
  auditLog(AUDIT.CLASS_CREATED, { classId: newClass._id, subjectId, topic, year, semester, section, stream }, { req, user: req.user });
  res.status(201).json(newClass);
});

router.put('/:id', authenticate, authorize('professor', 'admin'), async (req, res) => {
  await col('classes').updateOne({ _id: req.params.id }, { $set: req.body });
  const cls = await col('classes').findOne({ _id: req.params.id });
  res.json(cls);
});

router.delete('/:id', authenticate, authorize('professor', 'admin'), async (req, res) => {
  await col('classes').deleteOne({ _id: req.params.id });
  res.json({ message: 'Class deleted' });
});

export default router;
