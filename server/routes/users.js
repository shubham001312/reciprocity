import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const router = Router();

const mapUser = ({ _id, password, ...rest }) => ({ id: _id, ...rest });

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  const { role, year, section, stream, semester, department } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (year) filter.year = parseInt(year);
  if (section) filter.section = section;
  if (stream) filter.stream = stream;
  if (semester) filter.semester = parseInt(semester);
  if (department) filter.department = department;
  const users = await col('users').find(filter).project({ password: 0 }).toArray();
  res.json(users.map(mapUser));
});

router.get('/filter-options', authenticate, async (req, res) => {
  const users = await col('users').find().toArray();
  const years = [...new Set(users.map(u => u.year).filter(Boolean))].sort((a, b) => a - b);
  const sections = [...new Set(users.map(u => u.section).filter(Boolean))].sort();
  const streams = [...new Set(users.map(u => u.stream).filter(Boolean))].sort();
  const departments = [...new Set(users.map(u => u.department).filter(Boolean))].sort();
  res.json({ years, sections, streams, departments });
});

router.get('/professors', authenticate, async (req, res) => {
  const users = await col('users').find({ role: 'professor' }).project({ password: 0 }).toArray();
  res.json(users.map(mapUser));
});

router.get('/students', authenticate, async (req, res) => {
  const { year, section, stream } = req.query;
  const filter = { role: 'student' };
  if (year) filter.year = parseInt(year);
  if (section) filter.section = section;
  if (stream) filter.stream = stream;
  const users = await col('users').find(filter).project({ password: 0 }).toArray();
  res.json(users.map(mapUser));
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, email, password, role, rollNumber, department, year, section, stream, semester } = req.body;
  const existing = await col('users').findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already exists' });
  const hashed = await bcrypt.hash(password || 'password123', 10);
  const newUser = {
    _id: `${role.substring(0, 4)}-${uuid().substring(0, 8)}`,
    name, email, password: hashed, role,
    rollNumber: rollNumber || null,
    department: department || '',
    year: year || null,
    section: section || null,
    stream: stream || null,
    semester: semester || null,
    createdAt: new Date().toISOString(),
  };
  await col('users').insertOne(newUser);
  const { password: _, _id, ...rest } = newUser;
  res.status(201).json({ id: _id, ...rest });
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  await col('users').updateOne({ _id: req.params.id }, { $set: req.body });
  const user = await col('users').findOne({ _id: req.params.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, _id, ...rest } = user;
  res.json({ id: _id, ...rest });
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  await col('users').deleteOne({ _id: req.params.id });
  res.json({ message: 'User deleted' });
});

export default router;
