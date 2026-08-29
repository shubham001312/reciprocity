import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const syllabus = await col('syllabus').find().toArray();
  const subjects = await col('subjects').find().toArray();
  const notes = await col('notes').find().toArray();
  const classes = await col('classes').find().toArray();

  const result = syllabus.map(s => {
    const subject = subjects.find(sub => sub._id === s.subjectId);
    const subjectNotes = notes.filter(n => n.subjectId === s.subjectId);
    const subjectClasses = classes.filter(c => c.subjectId === s.subjectId);
    const coveredTopics = subjectNotes.flatMap(n => n.topicsCovered);
    const uniqueCovered = [...new Set(coveredTopics.map(t => t.toLowerCase()))];
    const topicStatus = s.topics.map(topic => ({
      topic,
      covered: uniqueCovered.some(ct => ct.includes(topic.toLowerCase()) || topic.toLowerCase().includes(ct)),
    }));
    const coveredCount = topicStatus.filter(t => t.covered).length;
    return {
      _id: s._id, subjectId: s.subjectId,
      subjectName: subject?.name, subjectCode: subject?.code, professorId: subject?.professorId,
      topics: topicStatus, totalTopics: s.topics.length, coveredTopics: coveredCount,
      coveragePercentage: s.topics.length > 0 ? Math.round((coveredCount / s.topics.length) * 100) : 0,
      classesHeld: subjectClasses.length,
    };
  });
  res.json(result);
});

router.get('/:subjectId', authenticate, async (req, res) => {
  const s = await col('syllabus').findOne({ subjectId: req.params.subjectId });
  if (!s) return res.status(404).json({ error: 'Syllabus not found' });
  const subject = await col('subjects').findOne({ _id: s.subjectId });
  const subjectNotes = await col('notes').find({ subjectId: s.subjectId }).toArray();
  const subjectClasses = await col('classes').find({ subjectId: s.subjectId }).toArray();
  const coveredTopics = subjectNotes.flatMap(n => n.topicsCovered);
  const uniqueCovered = [...new Set(coveredTopics.map(t => t.toLowerCase()))];
  const topicStatus = s.topics.map(topic => ({
    topic,
    covered: uniqueCovered.some(ct => ct.includes(topic.toLowerCase()) || topic.toLowerCase().includes(ct)),
  }));
  const coveredCount = topicStatus.filter(t => t.covered).length;
  res.json({
    _id: s._id, subjectId: s.subjectId,
    subjectName: subject?.name, subjectCode: subject?.code,
    topics: topicStatus, totalTopics: s.topics.length, coveredTopics: coveredCount,
    coveragePercentage: s.topics.length > 0 ? Math.round((coveredCount / s.topics.length) * 100) : 0,
    classesHeld: subjectClasses.length, notes: subjectNotes,
  });
});

export default router;
