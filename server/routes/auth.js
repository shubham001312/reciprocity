import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { col } from '../utils/db.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }
    const existing = await col('users').findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      _id: `${role.substring(0, 4)}-${uuid().substring(0, 8)}`,
      name, email, password: hashed, role,
      rollNumber: rollNumber || null,
      department: department || '',
      createdAt: new Date().toISOString(),
    };
    await col('users').insertOne(newUser);
    const token = jwt.sign({ id: newUser._id, email, role, name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, _id, ...rest } = newUser;
    res.status(201).json({ user: { id: _id, ...rest }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await col('users').findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, _id, ...rest } = user;
    res.json({ user: { id: _id, ...rest }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await col('users').findOne({ _id: req.user.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, _id, ...rest } = user;
  res.json({ id: _id, ...rest });
});

export default router;
