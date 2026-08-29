import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/semester/:studentId', authenticate, async (req, res) => {
  const student = await col('users').findOne({ _id: req.params.studentId });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const allMarks = await col('marks').find({ studentId: student._id }).toArray();
  const allAtt = await col('attendance').find({ studentId: student._id }).toArray();
  const subjects = await col('subjects').find().toArray();
  const allClasses = await col('classes').find().toArray();
  const present = allAtt.filter(a => a.status === 'present').length;

  const subjectReport = subjects.map(sub => {
    const subMarks = allMarks.filter(m => m.subjectId === sub._id);
    const totalMarks = subMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const maxTotal = subMarks.reduce((sum, m) => sum + m.maxMarks, 0);
    const subAtt = allAtt.filter(a => {
      const cls = allClasses.find(c => c._id === a.classId);
      return cls && cls.subjectId === sub._id;
    });
    const subPresent = subAtt.filter(a => a.status === 'present').length;
    return {
      subject: sub.name, code: sub.code,
      marks: totalMarks, maxMarks: maxTotal,
      percentage: maxTotal > 0 ? Math.round((totalMarks / maxTotal) * 100) : 0,
      classesHeld: subAtt.length, classesAttended: subPresent,
      attendance: subAtt.length > 0 ? Math.round((subPresent / subAtt.length) * 100) : 0,
    };
  });

  const overallMarks = subjectReport.reduce((sum, s) => sum + s.marks, 0);
  const overallMax = subjectReport.reduce((sum, s) => sum + s.maxMarks, 0);

  res.json({
    student: { name: student.name, rollNumber: student.rollNumber, department: student.department },
    semester: 3, reportDate: new Date().toISOString(),
    subjects: subjectReport,
    overall: {
      totalMarks: overallMarks, maxMarks: overallMax,
      percentage: overallMax > 0 ? Math.round((overallMarks / overallMax) * 100) : 0,
      totalClasses: allAtt.length, classesAttended: present,
      attendance: allAtt.length > 0 ? Math.round((present / allAtt.length) * 100) : 0,
    },
    generatedAt: new Date().toISOString(),
  });
});

export default router;
