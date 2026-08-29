import { Router } from 'express';
import { col } from '../utils/db.js';

const router = Router();

// GET /api/rankings/colleges — College rankings (public)
router.get('/colleges', async (req, res) => {
  const colleges = await col('colleges').find().toArray();
  const users = await col('users').find().toArray();
  const subjects = await col('subjects').find().toArray();
  const classes = await col('classes').find().toArray();
  const attendance = await col('attendance').find().toArray();
  const marks = await col('marks').find().toArray();
  const notes = await col('notes').find().toArray();
  const questions = await col('questions').find().toArray();

  const rankings = colleges.map(college => {
    const deptSet = new Set(college.departments || []);
    const profs = users.filter(u => u.role === 'professor' && (deptSet.has(u.department) || u.collegeId === college._id));
    const studs = users.filter(u => u.role === 'student' && (deptSet.has(u.department) || u.collegeId === college._id));
    const subjs = subjects.filter(s => deptSet.has(s.department));

    const profIds = profs.map(p => p._id);
    const collegeClasses = classes.filter(c => profIds.includes(c.professorId));
    const classIds = collegeClasses.map(c => c._id);
    const collegeAtt = attendance.filter(a => classIds.includes(a.classId));
    const pres = collegeAtt.filter(a => a.status === 'present').length;

    const studentIds = studs.map(s => s._id);
    const collegeMarks = marks.filter(m => studentIds.includes(m.studentId));
    const totalM = collegeMarks.reduce((s, m) => s + m.marksObtained, 0);
    const maxM = collegeMarks.reduce((s, m) => s + m.maxMarks, 0);

    const collegeNotes = notes.filter(n => profIds.includes(n.professorId));
    const collegePapers = questions.filter(q => profIds.includes(q.uploadedBy));
    const avgSim = collegePapers.length > 0 ? Math.round(collegePapers.reduce((s, q) => s + (q.similarityScore || 0), 0) / collegePapers.length) : 0;

    // Composite score: attendance(30%) + marks(30%) + faculty strength(20%) + resources(20%)
    const attScore = collegeAtt.length > 0 ? (pres / collegeAtt.length) * 100 : 0;
    const marksScore = maxM > 0 ? (totalM / maxM) * 100 : 0;
    const facultyScore = Math.min(profs.length * 10, 100);
    const resourceScore = Math.min((collegeNotes.length * 5 + collegePapers.length * 10 + subjs.length * 3), 100);

    const compositeScore = Math.round(attScore * 0.3 + marksScore * 0.3 + facultyScore * 0.2 + resourceScore * 0.2);

    return {
      id: college._id, name: college.name, code: college.code,
      accreditation: college.accreditation, affiliation: college.affiliation,
      totalProfessors: profs.length, totalStudents: studs.length,
      totalSubjects: subjs.length, totalClasses: collegeClasses.length,
      avgAttendance: collegeAtt.length > 0 ? Math.round((pres / collegeAtt.length) * 100) : 0,
      avgMarks: maxM > 0 ? Math.round((totalM / maxM) * 100) : 0,
      avgSimilarity: avgSim,
      compositeScore,
      departments: college.departments?.length || 0,
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);

  rankings.forEach((r, i) => { r.rank = i + 1; });
  res.json(rankings);
});

// GET /api/rankings/professors — Professor rankings (public)
router.get('/professors', async (req, res) => {
  const professors = await col('users').find({ role: 'professor' }).toArray();
  const classes = await col('classes').find().toArray();
  const attendance = await col('attendance').find().toArray();
  const marks = await col('marks').find().toArray();
  const notes = await col('notes').find().toArray();
  const questions = await col('questions').find().toArray();
  const colleges = await col('colleges').find().toArray();

  const rankings = professors.map(prof => {
    const profClasses = classes.filter(c => c.professorId === prof._id);
    const classIds = profClasses.map(c => c._id);
    const profAtt = attendance.filter(a => classIds.includes(a.classId));
    const pres = profAtt.filter(a => a.status === 'present').length;
    const profNotes = notes.filter(n => n.professorId === prof._id);
    const profPapers = questions.filter(q => q.uploadedBy === prof._id);
    const avgSim = profPapers.length > 0 ? Math.round(profPapers.reduce((s, q) => s + (q.similarityScore || 0), 0) / profPapers.length) : 0;

    // Find college
    const college = colleges.find(c => (c.departments || []).includes(prof.department));

    // Composite: attendance(40%) + similarity(30%) + notes(15%) + classes(15%)
    const attScore = profAtt.length > 0 ? (pres / profAtt.length) * 100 : 0;
    const simScore = avgSim;
    const notesScore = Math.min(profNotes.length * 10, 100);
    const classScore = Math.min(profClasses.length * 8, 100);

    const compositeScore = Math.round(attScore * 0.4 + simScore * 0.3 + notesScore * 0.15 + classScore * 0.15);

    return {
      id: prof._id, name: prof.name, email: prof.email,
      department: prof.department, stream: prof.stream,
      collegeId: college?._id, collegeName: college?.name || 'Independent',
      classesTaken: profClasses.length,
      avgAttendance: profAtt.length > 0 ? Math.round((pres / profAtt.length) * 100) : 0,
      notesRecorded: profNotes.length,
      questionPapers: profPapers.length,
      avgSimilarity: avgSim,
      compositeScore,
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);

  rankings.forEach((r, i) => { r.rank = i + 1; });
  res.json(rankings);
});

// GET /api/rankings/students — Student rankings (public)
router.get('/students', async (req, res) => {
  const students = await col('users').find({ role: 'student' }).toArray();
  const attendance = await col('attendance').find().toArray();
  const marks = await col('marks').find().toArray();
  const colleges = await col('colleges').find().toArray();

  const rankings = students.map(stud => {
    const studAtt = attendance.filter(a => a.studentId === stud._id);
    const pres = studAtt.filter(a => a.status === 'present').length;
    const studMarks = marks.filter(m => m.studentId === stud._id);
    const totalM = studMarks.reduce((s, m) => s + m.marksObtained, 0);
    const maxM = studMarks.reduce((s, m) => s + m.maxMarks, 0);

    const college = colleges.find(c => (c.departments || []).includes(stud.department));

    const attRate = studAtt.length > 0 ? (pres / studAtt.length) * 100 : 0;
    const marksRate = maxM > 0 ? (totalM / maxM) * 100 : 0;

    // Composite: attendance(30%) + marks(70%)
    const compositeScore = Math.round(attRate * 0.3 + marksRate * 0.7);

    let standing = 'D';
    if (compositeScore >= 75) standing = 'A';
    else if (compositeScore >= 60) standing = 'B';
    else if (compositeScore >= 45) standing = 'C';

    return {
      id: stud._id, name: stud.name, rollNumber: stud.rollNumber,
      department: stud.department, year: stud.year, section: stud.section, stream: stud.stream, semester: stud.semester,
      collegeId: college?._id, collegeName: college?.name || 'Independent',
      attendanceRate: Math.round(attRate),
      marksRate: Math.round(marksRate),
      compositeScore,
      standing,
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);

  rankings.forEach((r, i) => { r.rank = i + 1; });
  res.json(rankings);
});

// GET /api/rankings/stats — Public stats
router.get('/stats', async (req, res) => {
  const colleges = await col('colleges').find().toArray();
  const users = await col('users').find().toArray();
  const classes = await col('classes').find().toArray();
  const attendance = await col('attendance').find().toArray();
  const marks = await col('marks').find().toArray();

  const profs = users.filter(u => u.role === 'professor');
  const studs = users.filter(u => u.role === 'student');
  const pres = attendance.filter(a => a.status === 'present').length;
  const totalM = marks.reduce((s, m) => s + m.marksObtained, 0);
  const maxM = marks.reduce((s, m) => s + m.maxMarks, 0);

  res.json({
    colleges: colleges.length,
    professors: profs.length,
    students: studs.length,
    classes: classes.length,
    avgAttendance: attendance.length > 0 ? Math.round((pres / attendance.length) * 100) : 0,
    avgMarks: maxM > 0 ? Math.round((totalM / maxM) * 100) : 0,
  });
});

export default router;
