import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET /api/colleges — List all colleges (public for homepage)
router.get('/', async (req, res) => {
  const colleges = await col('colleges').find().toArray();
  const subjects = await col('subjects').find().toArray();
  const users = await col('users').find().toArray();
  const classes = await col('classes').find().toArray();
  const attendance = await col('attendance').find().toArray();

  // Enrich each college with stats
  const enriched = colleges.map(college => {
    const deptSet = new Set(college.departments || []);
    const collegeProfessors = users.filter(u => u.role === 'professor' && deptSet.has(u.department));
    const collegeStudents = users.filter(u => u.role === 'student' && deptSet.has(u.department));
    const collegeSubjects = subjects.filter(s => deptSet.has(s.department));

    const profIds = collegeProfessors.map(p => p._id);
    const collegeClasses = classes.filter(c => profIds.includes(c.professorId));
    const classIds = collegeClasses.map(c => c._id);
    const collegeAtt = attendance.filter(a => classIds.includes(a.classId));
    const present = collegeAtt.filter(a => a.status === 'present').length;

    return {
      ...college,
      stats: {
        professors: collegeProfessors.length,
        students: collegeStudents.length,
        subjects: collegeSubjects.length,
        classesHeld: collegeClasses.length,
        avgAttendance: collegeAtt.length > 0 ? Math.round((present / collegeAtt.length) * 100) : 0,
      },
    };
  });

  res.json(enriched);
});

// GET /api/colleges/:id — Single college detail
router.get('/:id', async (req, res) => {
  const college = await col('colleges').findOne({ _id: req.params.id });
  if (!college) return res.status(404).json({ error: 'College not found' });

  const subjects = await col('subjects').find().toArray();
  const users = await col('users').find().toArray();
  const classes = await col('classes').find().toArray();
  const attendance = await col('attendance').find().toArray();
  const marks = await col('marks').find().toArray();
  const syllabus = await col('syllabus').find().toArray();

  const deptSet = new Set(college.departments || []);
  const professors = users.filter(u => u.role === 'professor' && deptSet.has(u.department));
  const students = users.filter(u => u.role === 'student' && deptSet.has(u.department));
  const collegeSubjects = subjects.filter(s => deptSet.has(s.department));

  const enrichedProfs = professors.map(prof => {
    const profClasses = classes.filter(c => c.professorId === prof._id);
    const classIds = profClasses.map(c => c._id);
    const profAtt = attendance.filter(a => classIds.includes(a.classId));
    const present = profAtt.filter(a => a.status === 'present').length;
    return {
      id: prof._id, name: prof.name, email: prof.email, department: prof.department,
      classesTaken: profClasses.length,
      avgAttendance: profAtt.length > 0 ? Math.round((present / profAtt.length) * 100) : 0,
    };
  });

  const enrichedSubjects = collegeSubjects.map(sub => {
    const subClasses = classes.filter(c => c.subjectId === sub._id);
    const subSyllabus = syllabus.find(s => s.subjectId === sub._id);
    const subMarks = marks.filter(m => m.subjectId === sub._id);
    const totalM = subMarks.reduce((s, m) => s + m.marksObtained, 0);
    const maxM = subMarks.reduce((s, m) => s + m.maxMarks, 0);
    return {
      id: sub._id, name: sub.name, code: sub.code, credits: sub.credits, semester: sub.semester,
      classesHeld: subClasses.length,
      topicsCount: subSyllabus?.topics?.length || 0,
      avgMarks: maxM > 0 ? Math.round((totalM / maxM) * 100) : 0,
    };
  });

  // Year/semester breakdown
  const yearBreakdown = {};
  for (const stu of students) {
    const y = stu.year || 1;
    if (!yearBreakdown[y]) yearBreakdown[y] = { year: y, count: 0, sections: {} };
    yearBreakdown[y].count++;
    const sec = stu.section || 'A';
    if (!yearBreakdown[y].sections[sec]) yearBreakdown[y].sections[sec] = 0;
    yearBreakdown[y].sections[sec]++;
  }

  res.json({ ...college, professors: enrichedProfs, subjects: enrichedSubjects, yearBreakdown: Object.values(yearBreakdown), totalStudents: students.length, totalProfessors: professors.length });
});

// POST /api/colleges — Register new college (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, code, established, address, website, departments, accreditation, affiliation } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });

  const existing = await col('colleges').findOne({ code });
  if (existing) return res.status(409).json({ error: 'College code already exists' });

  const newCollege = {
    _id: `col-${uuid().substring(0, 8)}`,
    name, code, established: established || null, address: address || '',
    website: website || '', departments: departments || [],
    accreditation: accreditation || 'Pending', affiliation: affiliation || '',
    totalStudents: 0, totalFaculty: 0, createdAt: new Date().toISOString(),
  };
  await col('colleges').insertOne(newCollege);
  res.status(201).json(newCollege);
});

// PUT /api/colleges/:id — Update college (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const college = await col('colleges').findOne({ _id: req.params.id });
  if (!college) return res.status(404).json({ error: 'College not found' });
  await col('colleges').updateOne({ _id: req.params.id }, { $set: req.body });
  const updated = await col('colleges').findOne({ _id: req.params.id });
  res.json(updated);
});

// DELETE /api/colleges/:id — Remove college (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  await col('colleges').deleteOne({ _id: req.params.id });
  res.json({ message: 'College deleted' });
});

export default router;
