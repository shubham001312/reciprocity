import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/rankings/teachers — Teacher performance ranking
router.get('/teachers', async (req, res) => {
  const professors = await col('users').find({ role: 'professor' }).project({ password: 0 }).toArray();
  const subjects = await col('subjects').find().toArray();
  const allClasses = await col('classes').find().toArray();
  const allAtt = await col('attendance').find().toArray();
  const allNotes = await col('notes').find().toArray();
  const allQuestions = await col('questions').find().toArray();

  const rankings = professors.map(prof => {
    const profClasses = allClasses.filter(c => c.professorId === prof._id);
    const classIds = profClasses.map(c => c._id);
    const profAtt = allAtt.filter(a => classIds.includes(a.classId));
    const present = profAtt.filter(a => a.status === 'present').length;
    const avgAttendance = profAtt.length > 0 ? Math.round((present / profAtt.length) * 100) : 0;

    const profNotes = allNotes.filter(n => n.professorId === prof._id);
    const profQuestions = allQuestions.filter(q => q.uploadedBy === prof._id);
    const avgSimilarity = profQuestions.length > 0
      ? Math.round(profQuestions.reduce((sum, q) => sum + (q.similarityScore || 0), 0) / profQuestions.length) : 0;

    const subject = subjects.find(s => s.professorId === prof._id);

    // Score: weighted combination of attendance (40%), similarity (40%), notes (20%)
    const notesScore = Math.min(profNotes.length * 10, 100);
    const overallScore = Math.round(avgAttendance * 0.4 + avgSimilarity * 0.4 + notesScore * 0.2);

    return {
      id: prof._id,
      name: prof.name,
      department: prof.department,
      subject: subject?.name || 'N/A',
      subjectCode: subject?.code || '',
      classesTaken: profClasses.length,
      avgAttendance,
      notesRecorded: profNotes.length,
      questionPapers: profQuestions.length,
      similarityScore: avgSimilarity,
      overallScore,
      trend: avgAttendance >= 80 ? 'up' : avgAttendance >= 60 ? 'stable' : 'down',
    };
  });

  rankings.sort((a, b) => b.overallScore - a.overallScore);
  rankings.forEach((r, i) => { r.rank = i + 1; });

  res.json(rankings);
});

// GET /api/rankings/students — Student performance ranking
router.get('/students', async (req, res) => {
  const students = await col('users').find({ role: 'student' }).toArray();
  const subjects = await col('subjects').find().toArray();
  const allAtt = await col('attendance').find().toArray();
  const allMarks = await col('marks').find().toArray();
  const allClasses = await col('classes').find().toArray();

  const rankings = students.map(stud => {
    const studAtt = allAtt.filter(a => a.studentId === stud._id);
    const present = studAtt.filter(a => a.status === 'present').length;
    const attendancePct = studAtt.length > 0 ? Math.round((present / studAtt.length) * 100) : 0;

    const studMarks = allMarks.filter(m => m.studentId === stud._id);
    const totalMarks = studMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const maxMarks = studMarks.reduce((sum, m) => sum + m.maxMarks, 0);
    const avgMarks = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

    // Subject-wise breakdown
    const subjectBreakdown = subjects.map(sub => {
      const subMarks = studMarks.filter(m => m.subjectId === sub._id);
      const subTotal = subMarks.reduce((sum, m) => sum + m.marksObtained, 0);
      const subMax = subMarks.reduce((sum, m) => sum + m.maxMarks, 0);
      const subAtt = studAtt.filter(a => {
        const cls = allClasses.find(c => c._id === a.classId);
        return cls && cls.subjectId === sub._id;
      });
      const subPresent = subAtt.filter(a => a.status === 'present').length;
      return {
        subject: sub.name,
        code: sub.code,
        marks: subMax > 0 ? Math.round((subTotal / subMax) * 100) : 0,
        attendance: subAtt.length > 0 ? Math.round((subPresent / subAtt.length) * 100) : 0,
      };
    });

    // Score: weighted (attendance 30%, marks 70%)
    const overallScore = Math.round(attendancePct * 0.3 + avgMarks * 0.7);
    const standing = avgMarks >= 80 ? 'A' : avgMarks >= 65 ? 'B' : avgMarks >= 50 ? 'C' : 'D';

    return {
      id: stud._id,
      name: stud.name,
      rollNumber: stud.rollNumber,
      department: stud.department,
      attendance: attendancePct,
      avgMarks,
      totalMarks,
      maxMarks,
      standing,
      overallScore,
      subjects: subjectBreakdown,
      trend: avgMarks >= 70 ? 'up' : avgMarks >= 50 ? 'stable' : 'down',
    };
  });

  rankings.sort((a, b) => b.overallScore - a.overallScore);
  rankings.forEach((r, i) => { r.rank = i + 1; });

  res.json(rankings);
});

// GET /api/rankings/stats — Department-wide stats for homepage
router.get('/stats', async (req, res) => {
  const profCount = await col('users').countDocuments({ role: 'professor' });
  const studCount = await col('users').countDocuments({ role: 'student' });
  const subCount = await col('subjects').countDocuments();
  const classCount = await col('classes').countDocuments();
  const noteCount = await col('notes').countDocuments();
  const questionCount = await col('questions').countDocuments();

  const allAtt = await col('attendance').find().toArray();
  const totalPresent = allAtt.filter(a => a.status === 'present').length;
  const avgAttendance = allAtt.length > 0 ? Math.round((totalPresent / allAtt.length) * 100) : 0;

  const allMarks = await col('marks').find().toArray();
  const totalMarks = allMarks.reduce((sum, m) => sum + m.marksObtained, 0);
  const maxPossible = allMarks.reduce((sum, m) => sum + m.maxMarks, 0);
  const avgMarks = maxPossible > 0 ? Math.round((totalMarks / maxPossible) * 100) : 0;

  const allQuestions = await col('questions').find().toArray();
  const avgSimilarity = allQuestions.length > 0
    ? Math.round(allQuestions.reduce((sum, q) => sum + (q.similarityScore || 0), 0) / allQuestions.length) : 0;

  res.json({
    professors: profCount,
    students: studCount,
    subjects: subCount,
    classesHeld: classCount,
    notesRecorded: noteCount,
    questionPapers: questionCount,
    avgAttendance,
    avgMarks,
    avgSimilarity,
    totalRecords: allAtt.length + allMarks.length,
  });
});

export default router;
