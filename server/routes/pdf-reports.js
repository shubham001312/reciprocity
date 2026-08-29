import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/pdf/:studentId', authenticate, async (req, res) => {
  const studentId = req.params.studentId;
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: 'Cannot download other students\' reports' });
  }

  const student = await col('users').findOne({ _id: studentId });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const allMarks = await col('marks').find({ studentId }).toArray();
  const allAtt = await col('attendance').find({ studentId }).toArray();
  const subjects = await col('subjects').find().toArray();
  const allClasses = await col('classes').find().toArray();
  const present = allAtt.filter(a => a.status === 'present').length;

  const INK = '#1C2321', INK_SOFT = '#4A4F49', BRASS = '#A8862F', TEAL = '#1F6E76';
  const PRESENT_COLOR = '#2E5339', ABSENT_COLOR = '#B33A3A', PAPER = '#F7F5EF', LINE = '#D8D2C3';

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true,
    info: { Title: `Semester Report — ${student.name}`, Author: 'RECIPROCITY' } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${student.rollNumber || studentId}-sem3.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, 595.28, 90).fill(INK);
  doc.fontSize(22).fillColor('#FFFFFF').font('Helvetica-Bold').text('RECIPROCITY', 50, 25, { width: 300 });
  doc.fontSize(9).fillColor('#D8D2C3').font('Helvetica').text('Academic Accountability Register', 50, 52);
  doc.fontSize(9).fillColor(BRASS).font('Helvetica-Bold').text('SEMESTER REPORT', 400, 30, { width: 150, align: 'right' });
  doc.fontSize(8).fillColor('#D8D2C3').text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 400, 45, { width: 150, align: 'right' });

  let y = 110;
  doc.fillColor(INK).fontSize(14).font('Helvetica-Bold').text('Student Information', 50, y);
  y += 8; doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke(); y += 15;

  for (const [label, value] of [['Name', student.name], ['Roll Number', student.rollNumber || '—'], ['Department', student.department || '—'], ['Email', student.email], ['Semester', 'III'], ['Academic Year', '2026–2027']]) {
    doc.fontSize(8).fillColor(INK_SOFT).font('Helvetica').text(label, 50, y, { width: 100 });
    doc.fontSize(9).fillColor(INK).font('Helvetica-Bold').text(value || '—', 160, y, { width: 380 });
    y += 16;
  }

  y += 15;
  doc.fillColor(INK).fontSize(14).font('Helvetica-Bold').text('Overall Summary', 50, y);
  y += 8; doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke(); y += 15;

  const overallMarks = allMarks.reduce((sum, m) => sum + m.marksObtained, 0);
  const overallMax = allMarks.reduce((sum, m) => sum + m.maxMarks, 0);
  const overallPct = overallMax > 0 ? Math.round((overallMarks / overallMax) * 100) : 0;
  const attendancePct = allAtt.length > 0 ? Math.round((present / allAtt.length) * 100) : 0;

  const boxes = [
    { label: 'Total Marks', value: `${overallMarks} / ${overallMax}`, color: INK },
    { label: 'Percentage', value: `${overallPct}%`, color: overallPct >= 60 ? PRESENT_COLOR : ABSENT_COLOR },
    { label: 'Attendance', value: `${attendancePct}%`, color: attendancePct >= 75 ? TEAL : ABSENT_COLOR },
    { label: 'Standing', value: overallPct >= 80 ? 'A' : overallPct >= 65 ? 'B' : overallPct >= 50 ? 'C' : 'D', color: BRASS },
  ];
  boxes.forEach((box, i) => {
    const bx = 50 + i * 170;
    doc.rect(bx, y, 155, 55).fillAndStroke(PAPER, LINE);
    doc.rect(bx, y, 155, 3).fill(box.color);
    doc.fontSize(8).fillColor(INK_SOFT).font('Helvetica').text(box.label, bx + 10, y + 12, { width: 135 });
    doc.fontSize(18).fillColor(box.color).font('Helvetica-Bold').text(box.value, bx + 10, y + 26, { width: 135 });
  });
  y += 75;

  // Subject table
  doc.fillColor(INK).fontSize(14).font('Helvetica-Bold').text('Subject-wise Performance', 50, y);
  y += 8; doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke(); y += 10;

  const cols = [
    { label: 'Subject', x: 50, w: 160 }, { label: 'Code', x: 210, w: 60 },
    { label: 'Marks', x: 270, w: 70 }, { label: 'Max', x: 340, w: 50 },
    { label: '%', x: 390, w: 40 }, { label: 'Attendance', x: 430, w: 70 }, { label: 'Grade', x: 510, w: 40 },
  ];
  doc.rect(50, y, 495, 22).fill(INK);
  cols.forEach(col => { doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold').text(col.label, col.x + 5, y + 7, { width: col.w - 10 }); });
  y += 22;

  subjects.forEach((sub, idx) => {
    const subMarks = allMarks.filter(m => m.subjectId === sub._id);
    const totalMarks = subMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const maxTotal = subMarks.reduce((sum, m) => sum + m.maxMarks, 0);
    const pct = maxTotal > 0 ? Math.round((totalMarks / maxTotal) * 100) : 0;
    const subAtt = allAtt.filter(a => { const cls = allClasses.find(c => c._id === a.classId); return cls && cls.subjectId === sub._id; });
    const subPresent = subAtt.filter(a => a.status === 'present').length;
    const attPct = subAtt.length > 0 ? Math.round((subPresent / subAtt.length) * 100) : 0;
    const grade = pct >= 80 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : 'D';
    doc.rect(50, y, 495, 22).fill(idx % 2 === 0 ? '#FFFFFF' : PAPER);
    [{ text: sub.name, x: 55, w: 155 }, { text: sub.code, x: 215, w: 55 }, { text: String(totalMarks), x: 275, w: 65 },
     { text: String(maxTotal), x: 345, w: 45 }, { text: `${pct}%`, x: 395, w: 35 },
     { text: `${attPct}%`, x: 435, w: 65 }, { text: grade, x: 515, w: 35 }].forEach(c => {
      doc.fontSize(8).fillColor(INK).font('Helvetica').text(c.text, c.x, y + 7, { width: c.w });
    });
    y += 22;
  });

  y += 15;
  doc.fillColor(INK).fontSize(14).font('Helvetica-Bold').text('Attendance vs. Performance', 50, y);
  y += 8; doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke(); y += 15;

  subjects.forEach(sub => {
    const subMarks = allMarks.filter(m => m.subjectId === sub._id);
    const totalMarks = subMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const maxTotal = subMarks.reduce((sum, m) => sum + m.maxMarks, 0);
    const pct = maxTotal > 0 ? Math.round((totalMarks / maxTotal) * 100) : 0;
    const subAtt = allAtt.filter(a => { const cls = allClasses.find(c => c._id === a.classId); return cls && cls.subjectId === sub._id; });
    const subPresent = subAtt.filter(a => a.status === 'present').length;
    const attPct = subAtt.length > 0 ? Math.round((subPresent / subAtt.length) * 100) : 0;
    doc.fontSize(7).fillColor(INK_SOFT).font('Helvetica').text(sub.code, 50, y, { width: 50 });
    doc.rect(110, y, 200, 6).fill(LINE);
    doc.rect(110, y, Math.round(attPct * 2), 6).fill(TEAL);
    doc.fontSize(6).fillColor(TEAL).font('Helvetica-Bold').text(`${attPct}%`, 315, y - 1, { width: 35 });
    doc.rect(110, y + 9, 200, 6).fill(LINE);
    doc.rect(110, y + 9, Math.round(pct * 2), 6).fill('#6B3F69');
    doc.fontSize(6).fillColor('#6B3F69').font('Helvetica-Bold').text(`${pct}%`, 315, y + 8, { width: 35 });
    y += 28;
  });

  y += 5;
  doc.rect(110, y, 10, 6).fill(TEAL);
  doc.fontSize(7).fillColor(INK_SOFT).font('Helvetica').text('Attendance %', 125, y - 1, { width: 80 });
  doc.rect(210, y, 10, 6).fill('#6B3F69');
  doc.fontSize(7).fillColor(INK_SOFT).font('Helvetica').text('Marks %', 225, y - 1, { width: 60 });
  y += 30;

  // Remarks
  doc.fillColor(INK).fontSize(14).font('Helvetica-Bold').text('Remarks', 50, y);
  y += 8; doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke(); y += 12;
  let remark = overallPct >= 80 && attendancePct >= 80 ? 'Excellent performance.' :
    overallPct >= 65 && attendancePct >= 70 ? 'Good performance with room for improvement.' :
    attendancePct < 60 ? 'Attendance below threshold. Regular attendance strongly recommended.' :
    overallPct < 50 ? 'Academic performance needs improvement. Consult your department.' : 'Satisfactory. Keep up the effort.';
  doc.fontSize(9).fillColor(INK_SOFT).font('Helvetica').text(remark, 50, y, { width: 495 });

  // Footer
  doc.rect(0, 780, 595.28, 62).fill(INK);
  doc.fontSize(8).fillColor('#D8D2C3').font('Helvetica').text('RECIPROCITY — Academic Accountability Register', 50, 793, { width: 300 });
  doc.fontSize(7).fillColor('#4A4F49').text('Every Class. Every Student. Every Outcome Matters.', 50, 808, { width: 300 });

  doc.end();
});

export default router;
