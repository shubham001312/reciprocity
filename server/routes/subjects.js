import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const subjects = await col('subjects').find().toArray();
  res.json(subjects);
});

router.get('/:id', authenticate, async (req, res) => {
  const subject = await col('subjects').findOne({ _id: req.params.id });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, code, semester, department, professorId, credits } = req.body;
  const newSubject = { _id: `subj-${uuid().substring(0, 8)}`, name, code, semester, department, professorId, credits };
  await col('subjects').insertOne(newSubject);
  res.status(201).json(newSubject);
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  await col('subjects').updateOne({ _id: req.params.id }, { $set: req.body });
  const subject = await col('subjects').findOne({ _id: req.params.id });
  res.json(subject);
});

export default router;
