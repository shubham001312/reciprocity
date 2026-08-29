import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { professorId, subjectId } = req.query;
  const filter = {};
  if (professorId) filter.professorId = professorId;
  if (subjectId) filter.subjectId = subjectId;
  if (req.user.role === 'professor') filter.professorId = req.user.id;
  const notes = await col('notes').find(filter).sort({ createdAt: -1 }).toArray();
  res.json(notes);
});

router.post('/', authenticate, authorize('professor'), async (req, res) => {
  const { subjectId, title, topicsCovered, content } = req.body;
  const newNote = {
    _id: `note-${uuid().substring(0, 8)}`,
    professorId: req.user.id,
    subjectId, title, topicsCovered: topicsCovered || [],
    content: content || '',
    createdAt: new Date().toISOString(),
  };
  await col('notes').insertOne(newNote);
  res.status(201).json(newNote);
});

router.delete('/:id', authenticate, authorize('professor'), async (req, res) => {
  await col('notes').deleteOne({ _id: req.params.id });
  res.json({ message: 'Note deleted' });
});

export default router;
