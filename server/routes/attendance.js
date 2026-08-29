import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/attendance — Get attendance records
router.get('/', authenticate, async (req, res) => {
  const { classId, studentId, locked } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (studentId) filter.studentId = studentId;
  if (locked === 'true') filter.locked = true;
  if (locked === 'false') filter.locked = false;
  if (req.user.role === 'student') filter.studentId = req.user.id;
  const attendance = await col('attendance').find(filter).sort({ date: -1 }).toArray();
  res.json(attendance);
});

// POST /api/attendance/confirm-teacher — Teacher marks attendance for a class (bulk)
router.post('/confirm-teacher', authenticate, authorize('professor'), async (req, res) => {
  const { classId, records } = req.body; // records: [{studentId, status}]
  const cls = await col('classes').findOne({ _id: classId });
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const now = new Date().toISOString();
  const bulkOps = [];

  for (const r of records) {
    const existing = await col('attendance').findOne({ classId, studentId: r.studentId });
    if (existing && existing.locked) continue; // Can't modify locked records

    bulkOps.push({
      updateOne: {
        filter: { classId, studentId: r.studentId },
        update: {
          $set: {
            status: r.status,
            teacherConfirmed: true,
            teacherConfirmedAt: now,
            locked: existing?.studentConfirmed === true, // Lock only if student already confirmed
          },
          $setOnInsert: {
            _id: `att-${classId}-${r.studentId}`,
            classId,
            studentId: r.studentId,
            date: cls.date,
            studentConfirmed: false,
          },
        },
        upsert: true,
      },
    });
  }

  if (bulkOps.length > 0) {
    await col('attendance').bulkWrite(bulkOps);
  }

  // Update class present count
  const allAtt = await col('attendance').find({ classId }).toArray();
  const presentCount = allAtt.filter(a => a.status === 'present').length;
  await col('classes').updateOne({ _id: classId }, { $set: { studentsPresent: presentCount } });

  // Check how many are now locked
  const lockedCount = allAtt.filter(a => a.locked).length;
  const pendingCount = allAtt.filter(a => !a.locked).length;

  res.json({
    message: 'Attendance recorded by teacher',
    confirmed: records.length,
    locked: lockedCount,
    pending: pendingCount,
  });
});

// POST /api/attendance/confirm-student — Student confirms their own attendance for a class
router.post('/confirm-student', authenticate, authorize('student'), async (req, res) => {
  const { classId } = req.body;
  const studentId = req.user.id;
  const cls = await col('classes').findOne({ _id: classId });
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const existing = await col('attendance').findOne({ classId, studentId });
  if (!existing) {
    return res.status(400).json({ error: 'No attendance record found. Wait for your professor to mark attendance first.' });
  }
  if (existing.locked) {
    return res.status(400).json({ error: 'Attendance already confirmed and locked.' });
  }

  const now = new Date().toISOString();
  const willLock = existing.teacherConfirmed === true;

  await col('attendance').updateOne(
    { classId, studentId },
    { $set: {
      studentConfirmed: true,
      studentConfirmedAt: now,
      locked: willLock,
      confirmedAt: willLock ? now : null,
    }}
  );

  // If locking, update the class present count
  if (willLock) {
    const allAtt = await col('attendance').find({ classId }).toArray();
    const presentCount = allAtt.filter(a => a.status === 'present').length;
    await col('classes').updateOne({ _id: classId }, { $set: { studentsPresent: presentCount } });
  }

  res.json({
    message: willLock ? 'Attendance confirmed and locked!' : 'Your confirmation recorded. Waiting for professor to confirm.',
    locked: willLock,
    status: existing.status,
  });
});

// POST /api/attendance/student-bulk-confirm — Student confirms all pending for their classes
router.post('/student-bulk-confirm', authenticate, authorize('student'), async (req, res) => {
  const studentId = req.user.id;
  const { classIds } = req.body; // array of classIds to confirm

  const now = new Date().toISOString();
  let confirmed = 0;
  let locked = 0;

  for (const classId of classIds) {
    const existing = await col('attendance').findOne({ classId, studentId });
    if (!existing || existing.locked || existing.studentConfirmed) continue;

    const willLock = existing.teacherConfirmed === true;
    await col('attendance').updateOne(
      { classId, studentId },
      { $set: {
        studentConfirmed: true,
        studentConfirmedAt: now,
        locked: willLock,
        confirmedAt: willLock ? now : null,
      }}
    );
    confirmed++;
    if (willLock) locked++;
  }

  res.json({ message: `${confirmed} attendance confirmations submitted, ${locked} locked`, confirmed, locked });
});

// GET /api/attendance/pending — Get pending confirmations for current user
router.get('/pending', authenticate, async (req, res) => {
  if (req.user.role === 'student') {
    // Students see classes where teacher confirmed but they haven't
    const pending = await col('attendance').find({
      studentId: req.user.id,
      teacherConfirmed: true,
      studentConfirmed: false,
      locked: false,
    }).toArray();

    // Enrich with class details
    const enriched = [];
    for (const att of pending) {
      const cls = await col('classes').findOne({ _id: att.classId });
      if (cls) {
        const subject = await col('subjects').findOne({ _id: cls.subjectId });
        enriched.push({
          ...att,
          classTopic: cls.topic,
          classDate: cls.date,
          subjectName: subject?.name || 'Unknown',
          subjectCode: subject?.code || '',
          duration: cls.duration,
        });
      }
    }
    return res.json(enriched);
  }

  if (req.user.role === 'professor') {
    // Professors see classes where students confirmed but they haven't
    const profClasses = await col('classes').find({ professorId: req.user.id }).toArray();
    const classIds = profClasses.map(c => c._id);
    if (classIds.length === 0) return res.json([]);

    const pending = await col('attendance').find({
      classId: { $in: classIds },
      teacherConfirmed: false,
      locked: false,
    }).toArray();

    // Group by class
    const grouped = {};
    for (const att of pending) {
      if (!grouped[att.classId]) {
        const cls = profClasses.find(c => c._id === att.classId);
        const subject = cls ? await col('subjects').findOne({ _id: cls.subjectId }) : null;
        grouped[att.classId] = {
          classId: att.classId,
          topic: cls?.topic,
          date: cls?.date,
          subjectName: subject?.name,
          subjectCode: subject?.code,
          students: [],
        };
      }
      const student = await col('users').findOne({ _id: att.studentId }, { projection: { password: 0 } });
      grouped[att.classId].students.push({
        studentId: att.studentId,
        name: student?.name,
        rollNumber: student?.rollNumber,
        status: att.status,
      });
    }
    return res.json(Object.values(grouped));
  }

  res.json([]);
});

// GET /api/attendance/status/:classId — Get real-time attendance status for a class
router.get('/status/:classId', authenticate, async (req, res) => {
  const classId = req.params.classId;
  const allAtt = await col('attendance').find({ classId }).toArray();
  const cls = await col('classes').findOne({ _id: classId });

  const summary = {
    total: allAtt.length,
    teacherConfirmed: allAtt.filter(a => a.teacherConfirmed).length,
    studentConfirmed: allAtt.filter(a => a.studentConfirmed).length,
    locked: allAtt.filter(a => a.locked).length,
    pending: allAtt.filter(a => !a.locked).length,
    present: allAtt.filter(a => a.status === 'present').length,
    absent: allAtt.filter(a => a.status === 'absent').length,
    classTopic: cls?.topic,
    classDate: cls?.date,
  };

  // Per-student status
  const students = [];
  for (const att of allAtt) {
    const user = await col('users').findOne({ _id: att.studentId }, { projection: { password: 0 } });
    students.push({
      studentId: att.studentId,
      name: user?.name,
      rollNumber: user?.rollNumber,
      status: att.status,
      teacherConfirmed: att.teacherConfirmed,
      studentConfirmed: att.studentConfirmed,
      locked: att.locked,
      teacherConfirmedAt: att.teacherConfirmedAt,
      studentConfirmedAt: att.studentConfirmedAt,
      confirmedAt: att.confirmedAt,
    });
  }

  res.json({ summary, students });
});

// GET /api/attendance/history — Get attendance history with lock status
router.get('/history', authenticate, async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.studentId = req.user.id;
  if (req.user.role === 'professor') {
    const profClasses = await col('classes').find({ professorId: req.user.id }).toArray();
    filter.classId = { $in: profClasses.map(c => c._id) };
  }

  const attendance = await col('attendance').find(filter).sort({ date: -1 }).toArray();
  const enriched = [];

  for (const att of attendance) {
    const cls = await col('classes').findOne({ _id: att.classId });
    const subject = cls ? await col('subjects').findOne({ _id: cls.subjectId }) : null;
    const student = await col('users').findOne({ _id: att.studentId }, { projection: { password: 0 } });
    enriched.push({
      ...att,
      teacherConfirmed: att.teacherConfirmed ?? false,
      studentConfirmed: att.studentConfirmed ?? false,
      locked: att.locked ?? false,
      classTopic: cls?.topic,
      classDate: cls?.date,
      duration: cls?.duration,
      subjectName: subject?.name,
      subjectCode: subject?.code,
      studentName: student?.name,
      studentRoll: student?.rollNumber,
    });
  }

  res.json(enriched);
});

// Legacy POST /api/attendance — kept for backward compat
router.post('/', authenticate, authorize('professor'), async (req, res) => {
  const { classId, records } = req.body;
  const cls = await col('classes').findOne({ _id: classId });
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  await col('attendance').deleteMany({ classId });
  const now = new Date().toISOString();
  const newRecords = records.map(r => ({
    _id: `att-${classId}-${r.studentId}`,
    classId,
    studentId: r.studentId,
    status: r.status,
    date: cls.date,
    teacherConfirmed: true,
    teacherConfirmedAt: now,
    studentConfirmed: false,
    locked: false,
  }));
  if (newRecords.length > 0) await col('attendance').insertMany(newRecords);
  res.json({ message: 'Attendance recorded', count: newRecords.length });
});

router.get('/student/:studentId/summary', authenticate, async (req, res) => {
  const sid = req.params.studentId;
  const total = await col('attendance').countDocuments({ studentId: sid });
  const present = await col('attendance').countDocuments({ studentId: sid, status: 'present' });
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  res.json({ total, present, absent: total - present, percentage });
});

export default router;
