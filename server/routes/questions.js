import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { subjectId, semester } = req.query;
  const filter = {};
  if (subjectId) filter.subjectId = subjectId;
  if (semester) filter.semester = parseInt(semester);
  const questions = await col('questions').find(filter).sort({ uploadedAt: -1 }).toArray();
  res.json(questions);
});

router.post('/', authenticate, authorize('professor', 'admin'), async (req, res) => {
  const { subjectId, semester, title, topics } = req.body;
  // Compute similarity score against taught notes
  const subjectNotes = await col('notes').find({ subjectId }).toArray();
  const noteTopics = subjectNotes.flatMap(n => n.topicsCovered.map(t => t.toLowerCase()));
  const questionTopics = (topics || []).map(t => t.toLowerCase());
  const matched = questionTopics.filter(t => noteTopics.some(nt => nt.includes(t) || t.includes(nt)));
  const similarityScore = questionTopics.length > 0 ? Math.round((matched.length / questionTopics.length) * 100) : 0;

  const newQuestion = {
    _id: `q-${uuid().substring(0, 8)}`,
    subjectId, semester, title,
    uploadedBy: req.user.id,
    topics: topics || [],
    similarityScore,
    matchedTopics: matched,
    unmatchedTopics: questionTopics.filter(t => !matched.includes(t)),
    uploadedAt: new Date().toISOString(),
  };
  await col('questions').insertOne(newQuestion);
  res.status(201).json(newQuestion);
});

export default router;
