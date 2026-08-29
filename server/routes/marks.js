import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';
import { auditLog, AUDIT } from '../utils/audit.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { studentId, subjectId, semester } = req.query;
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  if (semester) filter.semester = parseInt(semester);
  if (req.user.role === 'student') filter.studentId = req.user.id;
  const marks = await col('marks').find(filter).toArray();
  res.json(marks);
});

router.post('/', authenticate, authorize('professor', 'admin'), async (req, res) => {
  const { studentId, subjectId, examType, marksObtained, maxMarks, semester } = req.body;
  const newMark = {
    _id: `mark-${uuid().substring(0, 8)}`,
    studentId, subjectId, examType, marksObtained, maxMarks: maxMarks || 100,
    semester: semester || 3,
    enteredBy: req.user.id,
    enteredAt: new Date().toISOString(),
  };
  await col('marks').insertOne(newMark);
  auditLog(AUDIT.MARKS_ENTERED, { studentId, subjectId, examType, marksObtained, maxMarks: maxMarks || 100, semester }, { req, user: req.user });
  res.status(201).json(newMark);
});

router.get('/student/:studentId/summary', authenticate, async (req, res) => {
  const sid = req.params.studentId;
  const subjects = await col('subjects').find().toArray();
  const allMarks = await col('marks').find({ studentId: sid }).toArray();
  const summary = subjects.map(sub => {
    const subMarks = allMarks.filter(m => m.subjectId === sub._id);
    const total = subMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const maxTotal = subMarks.reduce((sum, m) => sum + m.maxMarks, 0);
    return {
      subject: sub.name,
      code: sub.code,
      marks: total,
      maxMarks: maxTotal,
      percentage: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0,
    };
  });
  const overallTotal = summary.reduce((sum, s) => sum + s.marks, 0);
  const overallMax = summary.reduce((sum, s) => sum + s.maxMarks, 0);
  res.json({
    subjects: summary,
    overall: overallTotal,
    overallMax,
    average: overallMax > 0 ? Math.round((overallTotal / overallMax) * 100) : 0,
  });
});

export default router;
