import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authenticate, async (req, res) => {
  if (req.user.role === 'professor') {
    const profClasses = await col('classes').find({ professorId: req.user.id }).toArray();
    const profNotes = await col('notes').find({ professorId: req.user.id }).toArray();
    const profQuestions = await col('questions').find({ uploadedBy: req.user.id }).toArray();
    const classIds = profClasses.map(c => c._id);
    const profAttendance = classIds.length > 0 ? await col('attendance').find({ classId: { $in: classIds } }).toArray() : [];
    const totalPresent = profAttendance.filter(a => a.status === 'present').length;
    const avgAttendance = profAttendance.length > 0 ? Math.round((totalPresent / profAttendance.length) * 100) : 0;
    const avgSimilarity = profQuestions.length > 0
      ? Math.round(profQuestions.reduce((sum, q) => sum + (q.similarityScore || 0), 0) / profQuestions.length) : 0;
    return res.json({
      classesTaken: profClasses.length,
      avgAttendance,
      studentsPresent: profClasses.reduce((sum, c) => sum + (c.studentsPresent || 0), 0),
      notesRecorded: profNotes.length,
      similarityScore: avgSimilarity,
      recentClasses: profClasses.slice(-5).reverse(),
    });
  }

  if (req.user.role === 'student') {
    const studentAtt = await col('attendance').find({ studentId: req.user.id }).toArray();
    const present = studentAtt.filter(a => a.status === 'present').length;
    const total = studentAtt.length;
    const studentMarks = await col('marks').find({ studentId: req.user.id }).toArray();
    const avgMarks = studentMarks.length > 0
      ? Math.round(studentMarks.reduce((sum, m) => sum + m.marksObtained, 0) / studentMarks.length) : 0;
    const subjectsCount = await col('subjects').countDocuments();
    return res.json({
      attendance: total > 0 ? Math.round((present / total) * 100) : 0,
      avgMarks,
      subjectsTracked: subjectsCount,
      standing: avgMarks >= 80 ? 'A' : avgMarks >= 65 ? 'B' : avgMarks >= 50 ? 'C' : 'D',
    });
  }

  // Admin
  const profCount = await col('users').countDocuments({ role: 'professor' });
  const studCount = await col('users').countDocuments({ role: 'student' });
  const subCount = await col('subjects').countDocuments();
  const allAtt = await col('attendance').find().toArray();
  const totalPresent = allAtt.filter(a => a.status === 'present').length;
  const avgAttendance = allAtt.length > 0 ? Math.round((totalPresent / allAtt.length) * 100) : 0;
  const allQuestions = await col('questions').find().toArray();
  const avgSimilarity = allQuestions.length > 0
    ? Math.round(allQuestions.reduce((sum, q) => sum + (q.similarityScore || 0), 0) / allQuestions.length) : 0;
  res.json({ professors: profCount, students: studCount, subjects: subCount, avgAttendance, avgSimilarity });
});

router.get('/attendance-vs-marks', authenticate, async (req, res) => {
  const students = await col('users').find({ role: 'student' }).toArray();
  const allAtt = await col('attendance').find().toArray();
  const allMarks = await col('marks').find().toArray();
  const data = students.map(stud => {
    const studentAtt = allAtt.filter(a => a.studentId === stud._id);
    const present = studentAtt.filter(a => a.status === 'present').length;
    const attendancePct = studentAtt.length > 0 ? Math.round((present / studentAtt.length) * 100) : 0;
    const studentMarks = allMarks.filter(m => m.studentId === stud._id);
    const avgMarks = studentMarks.length > 0
      ? Math.round(studentMarks.reduce((sum, m) => sum + m.marksObtained, 0) / studentMarks.length) : 0;
    return { name: stud.name, rollNumber: stud.rollNumber, attendance: attendancePct, marks: avgMarks };
  });
  res.json(data);
});

router.get('/faculty-summary', authenticate, async (req, res) => {
  const professors = await col('users').find({ role: 'professor' }).toArray();
  const subjects = await col('subjects').find().toArray();
  const allClasses = await col('classes').find().toArray();
  const allAtt = await col('attendance').find().toArray();
  const allQuestions = await col('questions').find().toArray();

  const summary = professors.map(prof => {
    const profClasses = allClasses.filter(c => c.professorId === prof._id);
    const classIds = profClasses.map(c => c._id);
    const profAttendance = allAtt.filter(a => classIds.includes(a.classId));
    const present = profAttendance.filter(a => a.status === 'present').length;
    const avgAttendance = profAttendance.length > 0 ? Math.round((present / profAttendance.length) * 100) : 0;
    const profQuestions = allQuestions.filter(q => q.uploadedBy === prof._id);
    const avgSimilarity = profQuestions.length > 0
      ? Math.round(profQuestions.reduce((sum, q) => sum + (q.similarityScore || 0), 0) / profQuestions.length) : 0;
    const subject = subjects.find(s => s.professorId === prof._id);
    return { name: prof.name, subject: subject?.name || 'N/A', classes: profClasses.length, avgAttendance, similarity: avgSimilarity };
  });
  res.json(summary);
});

export default router;
