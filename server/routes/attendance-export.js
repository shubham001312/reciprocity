import { Router } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Helper: gather attendance data for a student
async function getStudentAttendanceData(studentId) {
  const student = await col('users').findOne({ _id: studentId });
  const allAtt = await col('attendance').find({ studentId }).sort({ date: -1 }).toArray();
  const subjects = await col('subjects').find().toArray();
  const allClasses = await col('classes').find().toArray();
  const allMarks = await col('marks').find({ studentId }).toArray();

  const subjectData = subjects.map(sub => {
    const subAtt = allAtt.filter(a => {
      const cls = allClasses.find(c => c._id === a.classId);
      return cls && cls.subjectId === sub._id;
    });
    const present = subAtt.filter(a => a.status === 'present').length;
    const subLocked = subAtt.filter(a => a.locked).length;
    const subMarks = allMarks.filter(m => m.subjectId === sub._id);
    const totalMarks = subMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const maxMarks = subMarks.reduce((sum, m) => sum + m.maxMarks, 0);

    return {
      name: sub.name,
      code: sub.code,
      classesHeld: subAtt.length,
      classesAttended: present,
      attendance: subAtt.length > 0 ? Math.round((present / subAtt.length) * 100) : 0,
      locked: subLocked,
      totalMarks,
      maxMarks,
      percentage: maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0,
    };
  });

  const totalPresent = allAtt.filter(a => a.status === 'present').length;
  const totalLocked = allAtt.filter(a => a.locked).length;
  const totalMarks = allMarks.reduce((sum, m) => sum + m.marksObtained, 0);
  const maxMarks = allMarks.reduce((sum, m) => sum + m.maxMarks, 0);

  return {
    student: { name: student.name, rollNumber: student.rollNumber, department: student.department, email: student.email },
    subjects: subjectData,
    overall: {
      totalClasses: allAtt.length,
      classesAttended: totalPresent,
      attendance: allAtt.length > 0 ? Math.round((totalPresent / allAtt.length) * 100) : 0,
      locked: totalLocked,
      totalMarks,
      maxMarks,
      percentage: maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0,
    },
    records: allAtt.map(a => {
      const cls = allClasses.find(c => c._id === a.classId);
      const sub = cls ? subjects.find(s => s._id === cls.subjectId) : null;
      return {
        date: a.date,
        topic: cls?.topic || 'Unknown',
        subject: sub?.name || 'Unknown',
        subjectCode: sub?.code || '',
        status: a.status,
        teacherConfirmed: a.teacherConfirmed,
        studentConfirmed: a.studentConfirmed,
        locked: a.locked,
      };
    }),
  };
}

// GET /api/attendance-export/pdf/:studentId
router.get('/pdf/:studentId', authenticate, async (req, res) => {
  const studentId = req.params.studentId;
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const data = await getStudentAttendanceData(studentId);
  const now = new Date();

  const INK = '#1A1B1E', INK_SOFT = '#6B7280', TEAL = '#0891B2', PRESENT = '#059669';
  const ABSENT = '#DC2626', BRASS = '#D97706', LINE = '#E5E7EB', PAPER = '#FAF9F6';

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true,
    info: { Title: `Attendance Report — ${data.student.name}`, Author: 'RECIPROCITY' } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-${data.student.rollNumber || studentId}.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, 595.28, 80).fill(INK);
  doc.fontSize(20).fillColor('#FFFFFF').font('Helvetica-Bold').text('RECIPROCITY', 50, 22, { width: 300 });
  doc.fontSize(8).fillColor('#9CA3AF').font('Helvetica').text('Attendance Report', 50, 46);
  doc.fontSize(9).fillColor(BRASS).font('Helvetica-Bold')
    .text(`Generated: ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 400, 25, { width: 150, align: 'right' });
  doc.fontSize(8).fillColor('#9CA3AF')
    .text(`Semester III · ${data.student.name}`, 400, 40, { width: 150, align: 'right' });

  let y = 100;

  // Summary boxes
  const boxes = [
    { label: 'Attendance', value: `${data.overall.attendance}%`, color: PRESENT },
    { label: 'Classes', value: `${data.overall.classesAttended}/${data.overall.totalClasses}`, color: TEAL },
    { label: 'Marks', value: `${data.overall.percentage}%`, color: '#9333EA' },
    { label: 'Locked', value: `${data.overall.locked}/${data.overall.totalClasses}`, color: BRASS },
  ];
  boxes.forEach((b, i) => {
    const bx = 50 + i * 130;
    doc.rect(bx, y, 120, 50).fillAndStroke(PAPER, LINE);
    doc.rect(bx, y, 120, 3).fill(b.color);
    doc.fontSize(7).fillColor(INK_SOFT).font('Helvetica').text(b.label, bx + 8, y + 10, { width: 104 });
    doc.fontSize(16).fillColor(b.color).font('Helvetica-Bold').text(b.value, bx + 8, y + 24, { width: 104 });
  });
  y += 70;

  // Subject table
  doc.fontSize(12).fillColor(INK).font('Helvetica-Bold').text('Subject-wise Attendance', 50, y);
  y += 5; doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke(); y += 10;

  const cols = [
    { label: 'Subject', x: 50, w: 150 }, { label: 'Code', x: 200, w: 55 },
    { label: 'Held', x: 255, w: 40 }, { label: 'Attended', x: 295, w: 55 },
    { label: 'Rate', x: 350, w: 45 }, { label: 'Marks', x: 395, w: 60 },
    { label: '%', x: 455, w: 35 }, { label: 'Locked', x: 490, w: 55 },
  ];
  doc.rect(50, y, 495, 20).fill(INK);
  cols.forEach(c => { doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold').text(c.label, c.x + 4, y + 6, { width: c.w - 8 }); });
  y += 20;

  data.subjects.forEach((s, i) => {
    doc.rect(50, y, 495, 18).fill(i % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
    [{ text: s.name, x: 54, w: 146 }, { text: s.code, x: 204, w: 51 }, { text: String(s.classesHeld), x: 259, w: 36 },
     { text: String(s.classesAttended), x: 299, w: 51 }, { text: `${s.attendance}%`, x: 354, w: 41 },
     { text: `${s.totalMarks}/${s.maxMarks}`, x: 399, w: 56 }, { text: `${s.percentage}%`, x: 459, w: 31 },
     { text: `${s.locked}`, x: 494, w: 51 }].forEach(c => {
      doc.fontSize(7).fillColor(INK).font('Helvetica').text(c.text, c.x, y + 5, { width: c.w });
    });
    y += 18;
  });

  y += 15;

  // Attendance history (last 30 records)
  doc.fontSize(12).fillColor(INK).font('Helvetica-Bold').text('Attendance History', 50, y);
  y += 5; doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke(); y += 10;

  const histCols = [
    { label: 'Date', x: 50, w: 70 }, { label: 'Subject', x: 120, w: 120 },
    { label: 'Topic', x: 240, w: 180 }, { label: 'Status', x: 420, w: 55 },
    { label: 'Lock', x: 475, w: 70 },
  ];
  doc.rect(50, y, 495, 18).fill(INK);
  histCols.forEach(c => { doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold').text(c.label, c.x + 4, y + 5, { width: c.w - 8 }); });
  y += 18;

  const showRecords = data.records.slice(0, 35);
  for (const r of showRecords) {
    if (y > 740) { doc.addPage(); y = 50; }
    doc.rect(50, y, 495, 16).fill(y % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
    [{ text: r.date, x: 54, w: 66 }, { text: r.subjectCode, x: 124, w: 116 },
     { text: r.topic.substring(0, 30), x: 244, w: 176 }, { text: r.status, x: 424, w: 51 },
     { text: r.locked ? 'Locked' : 'Open', x: 479, w: 66 }].forEach(c => {
      doc.fontSize(6.5).fillColor(INK).font('Helvetica').text(c.text, c.x, y + 4, { width: c.w });
    });
    y += 16;
  }

  // Footer
  doc.rect(0, 780, 595.28, 62).fill(INK);
  doc.fontSize(7).fillColor('#9CA3AF').font('Helvetica')
    .text('RECIPROCITY — Attendance Report · Every Class. Every Student. Every Outcome Matters.', 50, 795, { width: 400 });

  doc.end();
});

// GET /api/attendance-export/excel/:studentId
router.get('/excel/:studentId', authenticate, async (req, res) => {
  const studentId = req.params.studentId;
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const data = await getStudentAttendanceData(studentId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RECIPROCITY';
  workbook.created = new Date();

  // Summary sheet
  const summary = workbook.addWorksheet('Summary');
  summary.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  summary.addRow({ metric: 'Student Name', value: data.student.name });
  summary.addRow({ metric: 'Roll Number', value: data.student.rollNumber || 'N/A' });
  summary.addRow({ metric: 'Department', value: data.student.department || 'N/A' });
  summary.addRow({ metric: 'Email', value: data.student.email });
  summary.addRow({ metric: 'Semester', value: 'III' });
  summary.addRow({ metric: '' });
  summary.addRow({ metric: 'Overall Attendance', value: `${data.overall.attendance}%` });
  summary.addRow({ metric: 'Classes Attended', value: `${data.overall.classesAttended} / ${data.overall.totalClasses}` });
  summary.addRow({ metric: 'Overall Marks', value: `${data.overall.percentage}%` });
  summary.addRow({ metric: 'Total Marks', value: `${data.overall.totalMarks} / ${data.overall.maxMarks}` });
  summary.addRow({ metric: 'Locked Records', value: `${data.overall.locked} / ${data.overall.totalClasses}` });

  // Style header
  summary.getRow(1).font = { bold: true, size: 11 };
  summary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1B1E' } };
  summary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Subject-wise sheet
  const subjects = workbook.addWorksheet('Subject-wise');
  subjects.columns = [
    { header: 'Subject', key: 'name', width: 30 },
    { header: 'Code', key: 'code', width: 12 },
    { header: 'Classes Held', key: 'classesHeld', width: 14 },
    { header: 'Attended', key: 'classesAttended', width: 12 },
    { header: 'Attendance %', key: 'attendance', width: 14 },
    { header: 'Marks', key: 'marks', width: 15 },
    { header: 'Marks %', key: 'percentage', width: 12 },
    { header: 'Locked', key: 'locked', width: 10 },
  ];
  data.subjects.forEach(s => {
    subjects.addRow({
      name: s.name, code: s.code, classesHeld: s.classesHeld, classesAttended: s.classesAttended,
      attendance: `${s.attendance}%`, marks: `${s.totalMarks}/${s.maxMarks}`,
      percentage: `${s.percentage}%`, locked: s.locked,
    });
  });
  subjects.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  subjects.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1B1E' } };

  // Full history sheet
  const history = workbook.addWorksheet('Full History');
  history.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Subject', key: 'subject', width: 30 },
    { header: 'Code', key: 'subjectCode', width: 12 },
    { header: 'Topic', key: 'topic', width: 35 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Teacher Confirmed', key: 'teacherConfirmed', width: 18 },
    { header: 'Student Confirmed', key: 'studentConfirmed', width: 18 },
    { header: 'Locked', key: 'locked', width: 10 },
  ];
  data.records.forEach(r => {
    history.addRow({
      date: r.date, subject: r.subject, subjectCode: r.subjectCode, topic: r.topic,
      status: r.status, teacherConfirmed: r.teacherConfirmed ? 'Yes' : 'No',
      studentConfirmed: r.studentConfirmed ? 'Yes' : 'No', locked: r.locked ? 'Yes' : 'No',
    });
  });
  history.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  history.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1B1E' } };

  // Conditional formatting for status column in history
  history.addConditionalFormatting({
    ref: 'E2:E1000',
    rules: [
      { type: 'cellIs', operator: 'equal', priority: 1, formulae: ['"present"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFECFDF5' } }, font: { color: { argb: 'FF059669' } } } },
      { type: 'cellIs', operator: 'equal', priority: 2, formulae: ['"absent"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF2F2' } }, font: { color: { argb: 'FFDC2626' } } } },
    ],
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-${data.student.rollNumber || studentId}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

// GET /api/attendance-export/excel-all — Export all students (professor/admin)
router.get('/excel-all', authenticate, async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ error: 'Access denied' });

  const students = await col('users').find({ role: 'student' }).toArray();
  const subjects = await col('subjects').find().toArray();
  const allAtt = await col('attendance').find().toArray();
  const allClasses = await col('classes').find().toArray();
  const allMarks = await col('marks').find().toArray();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RECIPROCITY';

  // Overview sheet
  const overview = workbook.addWorksheet('Overview');
  overview.columns = [
    { header: 'Student', key: 'name', width: 20 },
    { header: 'Roll No.', key: 'roll', width: 15 },
    { header: 'Total Classes', key: 'total', width: 14 },
    { header: 'Attended', key: 'attended', width: 12 },
    { header: 'Attendance %', key: 'attendance', width: 14 },
    { header: 'Marks %', key: 'marks', width: 12 },
    { header: 'Standing', key: 'standing', width: 12 },
    { header: 'Locked', key: 'locked', width: 10 },
  ];

  for (const stud of students) {
    const studAtt = allAtt.filter(a => a.studentId === stud._id);
    const present = studAtt.filter(a => a.status === 'present').length;
    const locked = studAtt.filter(a => a.locked).length;
    const studMarks = allMarks.filter(m => m.studentId === stud._id);
    const totalM = studMarks.reduce((s, m) => s + m.marksObtained, 0);
    const maxM = studMarks.reduce((s, m) => s + m.maxMarks, 0);
    const avgMarks = maxM > 0 ? Math.round((totalM / maxM) * 100) : 0;
    const standing = avgMarks >= 80 ? 'A' : avgMarks >= 65 ? 'B' : avgMarks >= 50 ? 'C' : 'D';

    overview.addRow({
      name: stud.name, roll: stud.rollNumber || 'N/A', total: studAtt.length,
      attended: present, attendance: `${studAtt.length > 0 ? Math.round((present / studAtt.length) * 100) : 0}%`,
      marks: `${avgMarks}%`, standing, locked,
    });
  }
  overview.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  overview.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1B1E' } };

  // Per-student sheets
  for (const stud of students) {
    const sheet = workbook.addWorksheet(stud.name.substring(0, 28));
    sheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Subject', key: 'subject', width: 25 },
      { header: 'Topic', key: 'topic', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Locked', key: 'locked', width: 10 },
    ];
    const studAtt = allAtt.filter(a => a.studentId === stud._id).sort((a, b) => b.date.localeCompare(a.date));
    for (const a of studAtt) {
      const cls = allClasses.find(c => c._id === a.classId);
      const sub = cls ? subjects.find(s => s._id === cls.subjectId) : null;
      sheet.addRow({ date: a.date, subject: sub?.name || '', topic: cls?.topic || '', status: a.status, locked: a.locked ? 'Yes' : 'No' });
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1B1E' } };
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-all-students.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

export default router;
