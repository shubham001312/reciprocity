import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/profile/professor/:id — Detailed professor profile
router.get('/professor/:id', async (req, res) => {
  const user = await col('users').findOne({ _id: req.params.id, role: 'professor' });
  if (!user) return res.status(404).json({ error: 'Professor not found' });

  const { password, ...professor } = user;
  professor.id = professor._id;

  const subjects = await col('subjects').find({ professorId: user._id }).toArray();
  const classes = await col('classes').find({ professorId: user._id }).sort({ date: -1 }).toArray();
  const notes = await col('notes').find({ professorId: user._id }).sort({ createdAt: -1 }).toArray();
  const questions = await col('questions').find({ uploadedBy: user._id }).sort({ uploadedAt: -1 }).toArray();
  const attendance = await col('attendance').find().toArray();
  const marks = await col('marks').find().toArray();
  const syllabus = await col('syllabus').find().toArray();

  const classIds = classes.map(c => c._id);
  const profAtt = attendance.filter(a => classIds.includes(a.classId));
  const present = profAtt.filter(a => a.status === 'present').length;
  const locked = profAtt.filter(a => a.locked).length;

  // Subject-wise performance
  const subjectPerformance = subjects.map(sub => {
    const subClasses = classes.filter(c => c.subjectId === sub._id);
    const subAtt = profAtt.filter(a => {
      const cls = classes.find(c => c._id === a.classId);
      return cls?.subjectId === sub._id;
    });
    const subPresent = subAtt.filter(a => a.status === 'present').length;
    const subSyllabus = syllabus.find(s => s.subjectId === sub._id);
    const subNotes = notes.filter(n => n.subjectId === sub._id);

    return {
      id: sub._id, name: sub.name, code: sub.code, semester: sub.semester, credits: sub.credits,
      classesHeld: subClasses.length,
      avgAttendance: subAtt.length > 0 ? Math.round((subPresent / subAtt.length) * 100) : 0,
      notesRecorded: subNotes.length,
      topicsCovered: subSyllabus?.topics?.length || 0,
    };
  });

  // Monthly activity
  const monthly = {};
  classes.forEach(c => {
    const m = c.date?.substring(0, 7);
    if (m) monthly[m] = (monthly[m] || 0) + 1;
  });

  // Similarity stats from question papers
  const avgSimilarity = questions.length > 0
    ? Math.round(questions.reduce((s, q) => s + (q.similarityScore || 0), 0) / questions.length)
    : 0;

  res.json({
    ...professor,
    stats: {
      totalClasses: classes.length,
      totalStudents: classes.reduce((s, c) => s + (c.totalStudents || 0), 0),
      avgAttendance: profAtt.length > 0 ? Math.round((present / profAtt.length) * 100) : 0,
      totalNotes: notes.length,
      totalPapers: questions.length,
      avgSimilarity,
      lockedRecords: locked,
    },
    subjects: subjectPerformance,
    recentClasses: classes.slice(0, 10),
    recentNotes: notes.slice(0, 5),
    recentPapers: questions.slice(0, 5),
    monthlyActivity: Object.entries(monthly).sort().slice(-6).map(([month, count]) => ({ month, classes: count })),
  });
});

// GET /api/profile/student/:id — Detailed student profile
router.get('/student/:id', async (req, res) => {
  const user = await col('users').findOne({ _id: req.params.id, role: 'student' });
  if (!user) return res.status(404).json({ error: 'Student not found' });

  const { password, ...student } = user;
  student.id = student._id;

  const subjects = await col('subjects').find({ semester: user.semester, department: user.department }).toArray();
  const attendance = await col('attendance').find({ studentId: user._id }).toArray();
  const marks = await col('marks').find({ studentId: user._id }).toArray();
  const classes = await col('classes').find().toArray();
  const allStudents = await col('users').find({ role: 'student' }).toArray();

  const totalAtt = attendance.length;
  const presentAtt = attendance.filter(a => a.status === 'present').length;
  const lockedAtt = attendance.filter(a => a.locked).length;

  // Subject-wise breakdown
  const subjectBreakdown = subjects.map(sub => {
    const subAtt = attendance.filter(a => {
      const cls = classes.find(c => c._id === a.classId);
      return cls?.subjectId === sub._id;
    });
    const subPresent = subAtt.filter(a => a.status === 'present').length;
    const subMarks = marks.filter(m => m.subjectId === sub._id);
    const obtained = subMarks.reduce((s, m) => s + m.marksObtained, 0);
    const max = subMarks.reduce((s, m) => s + m.maxMarks, 0);

    return {
      id: sub._id, name: sub.name, code: sub.code, semester: sub.semester, credits: sub.credits,
      classesHeld: subAtt.length,
      classesAttended: subPresent,
      attendanceRate: subAtt.length > 0 ? Math.round((subPresent / subAtt.length) * 100) : 0,
      marksObtained: obtained,
      maxMarks: max,
      marksPercent: max > 0 ? Math.round((obtained / max) * 100) : 0,
    };
  });

  // Calculate standing
  const totalMarks = marks.reduce((s, m) => s + m.marksObtained, 0);
  const maxTotal = marks.reduce((s, m) => s + m.maxMarks, 0);
  const overallPercent = maxTotal > 0 ? Math.round((totalMarks / maxTotal) * 100) : 0;
  const overallAttendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
  let standing = 'D';
  if (overallPercent >= 80 && overallAttendance >= 80) standing = 'A';
  else if (overallPercent >= 65 && overallAttendance >= 70) standing = 'B';
  else if (overallPercent >= 50 && overallAttendance >= 60) standing = 'C';

  // Rank among peers
  const peers = allStudents.filter(s => s.year === user.year && s.section === user.section && s.stream === user.stream && s.semester === user.semester);
  const peerRanking = peers.sort((a, b) => {
    const aMarks = marks.filter(m => m.studentId === a._id).reduce((s, m) => s + m.marksObtained, 0);
    const bMarks = marks.filter(m => m.studentId === b._id).reduce((s, m) => s + m.marksObtained, 0);
    return bMarks - aMarks;
  }).findIndex(s => s._id === user._id) + 1;

  // Attendance calendar data
  const attByDate = {};
  attendance.forEach(a => {
    if (!attByDate[a.date]) attByDate[a.date] = { present: 0, absent: 0, total: 0 };
    attByDate[a.date].total++;
    if (a.status === 'present') attByDate[a.date].present++;
    else attByDate[a.date].absent++;
  });

  res.json({
    ...student,
    stats: {
      totalAttendance: totalAtt,
      presentCount: presentAtt,
      attendanceRate: overallAttendance,
      totalMarks,
      maxMarks: maxTotal,
      marksPercent: overallPercent,
      standing,
      rank: peerRanking,
      totalPeers: peers.length,
      lockedRecords: lockedAtt,
    },
    subjects: subjectBreakdown,
    attendanceHistory: attendance.slice(0, 50),
    marksHistory: marks,
    recentAttendance: Object.entries(attByDate).sort().slice(-30).map(([date, data]) => ({ date, ...data })),
  });
});

// GET /api/profile/college/:id — Detailed college profile
router.get('/college/:id', async (req, res) => {
  const college = await col('colleges').findOne({ _id: req.params.id });
  if (!college) return res.status(404).json({ error: 'College not found' });

  const users = await col('users').find().toArray();
  const subjects = await col('subjects').find().toArray();
  const classes = await col('classes').find().toArray();
  const attendance = await col('attendance').find().toArray();
  const marks = await col('marks').find().toArray();
  const syllabus = await col('syllabus').find().toArray();
  const notes = await col('notes').find().toArray();
  const questions = await col('questions').find().toArray();

  const deptSet = new Set(college.departments || []);
  const professors = users.filter(u => u.role === 'professor' && (deptSet.has(u.department) || u.collegeId === college._id));
  const students = users.filter(u => u.role === 'student' && (deptSet.has(u.department) || u.collegeId === college._id));

  // Department breakdown
  const departments = {};
  for (const dept of college.departments || []) {
    const deptProfs = professors.filter(p => p.department === dept);
    const deptStudents = students.filter(s => s.department === dept);
    const deptSubjects = subjects.filter(s => s.department === dept);
    departments[dept] = {
      name: dept,
      professors: deptProfs.length,
      students: deptStudents.length,
      subjects: deptSubjects.length,
    };
  }

  // Stream breakdown
  const streamMap = {};
  students.forEach(s => {
    const k = s.stream || 'Unknown';
    if (!streamMap[k]) streamMap[k] = { name: k, count: 0, avgAttendance: 0 };
    streamMap[k].count++;
  });
  // Calculate avg attendance per stream
  for (const [stream, data] of Object.entries(streamMap)) {
    const streamStudents = students.filter(s => s.stream === stream);
    const streamIds = streamStudents.map(s => s._id);
    const streamAtt = attendance.filter(a => streamIds.includes(a.studentId));
    const pres = streamAtt.filter(a => a.status === 'present').length;
    data.avgAttendance = streamAtt.length > 0 ? Math.round((pres / streamAtt.length) * 100) : 0;
  }

  // Rankings data
  const enrichedProfs = professors.map(prof => {
    const profClasses = classes.filter(c => c.professorId === prof._id);
    const classIds = profClasses.map(c => c._id);
    const profAtt = attendance.filter(a => classIds.includes(a.classId));
    const pres = profAtt.filter(a => a.status === 'present').length;
    const profNotes = notes.filter(n => n.professorId === prof._id);
    const profPapers = questions.filter(q => q.uploadedBy === prof._id);
    const avgSim = profPapers.length > 0 ? Math.round(profPapers.reduce((s, q) => s + (q.similarityScore || 0), 0) / profPapers.length) : 0;
    const score = Math.round((profAtt.length > 0 ? (pres / profAtt.length) * 100 : 0) * 0.4 + avgSim * 0.4 + Math.min(profNotes.length * 5, 100) * 0.2);
    return {
      id: prof._id, name: prof.name, email: prof.email, department: prof.department,
      classesTaken: profClasses.length,
      avgAttendance: profAtt.length > 0 ? Math.round((pres / profAtt.length) * 100) : 0,
      notesRecorded: profNotes.length,
      questionPapers: profPapers.length,
      avgSimilarity: avgSim,
      score,
    };
  }).sort((a, b) => b.score - a.score);

  // Overall stats
  const allClassIds = classes.map(c => c._id);
  const collegeAtt = attendance.filter(a => allClassIds.includes(a.classId));
  const presAll = collegeAtt.filter(a => a.status === 'present').length;
  const allMarks = marks;
  const totalM = allMarks.reduce((s, m) => s + m.marksObtained, 0);
  const maxM = allMarks.reduce((s, m) => s + m.maxMarks, 0);

  res.json({
    ...college,
    departments: Object.values(departments),
    streams: Object.values(streamMap),
    professors: enrichedProfs,
    totalStudents: students.length,
    totalProfessors: professors.length,
    totalSubjects: subjects.filter(s => deptSet.has(s.department)).length,
    totalClasses: classes.length,
    overallStats: {
      avgAttendance: collegeAtt.length > 0 ? Math.round((presAll / collegeAtt.length) * 100) : 0,
      avgMarks: maxM > 0 ? Math.round((totalM / maxM) * 100) : 0,
      totalAttendanceRecords: collegeAtt.length,
      totalMarksRecords: allMarks.length,
    },
    yearBreakdown: [1, 2, 3, 4].map(y => ({ year: y, count: students.filter(s => s.year === y).length })).filter(y => y.count > 0),
  });
});

// GET /api/profile/compare?ids=col-001,col-002,col-003 — Compare multiple colleges
router.get('/compare', async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (ids.length < 2 || ids.length > 3) return res.status(400).json({ error: 'Provide 2-3 college IDs' });

    const colleges = await col('colleges').find({ _id: { $in: ids } }).toArray();
    const allUsers = await col('users').find().toArray();
    const allClasses = await col('classes').find().toArray();
    const allAttendance = await col('attendance').find().toArray();
    const allSubjects = await col('subjects').find().toArray();

    const comparison = colleges.map(c => {
      const depts = c.departments || [];
      const deptNames = depts.map(d => typeof d === 'string' ? d : d.name);

      const profs = allUsers.filter(u => u.role === 'professor' && deptNames.includes(u.department));
      const studs = allUsers.filter(u => u.role === 'student' && deptNames.includes(u.department));
      const classIds = allClasses.filter(cl => profs.some(p => p._id === cl.professorId)).map(cl => cl._id);
      const att = allAttendance.filter(a => classIds.includes(a.classId) || studs.some(s => s._id === a.studentId));
      const subs = allSubjects.filter(s => deptNames.includes(s.department));

      const avgAtt = att.length > 0 ? Math.round(att.reduce((s, a) => s + (a.present ? 100 : 0), 0) / att.length) : 0;
      const streamMap = {};
      studs.forEach(s => { const k = s.stream || 'Other'; streamMap[k] = (streamMap[k] || 0) + 1; });
      const yearBreakdown = [1, 2, 3, 4].map(y => ({ year: y, count: studs.filter(s => s.year === y).length })).filter(y => y.count > 0);

      return {
        _id: c._id,
        name: c.name,
        code: c.code,
        accreditation: c.accreditation,
        affiliation: c.affiliation,
        established: c.established,
        totalProfessors: profs.length,
        totalStudents: studs.length,
        totalClasses: classIds.length,
        totalSubjects: subs.length,
        avgAttendance: avgAtt,
        streams: Object.entries(streamMap).map(([name, count]) => ({ name, count })),
        departments: deptNames,
        yearBreakdown,
        attendanceRecords: att.length,
      };
    });

    res.json(comparison);
  } catch (err) {
    res.status(500).json({ error: 'Comparison failed: ' + err.message });
  }
});

export default router;
