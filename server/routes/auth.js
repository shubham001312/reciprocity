import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { col } from '../utils/db.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';
import { auditLog, AUDIT } from '../utils/audit.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!['student', 'professor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
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
    auditLog(AUDIT.SIGNUP, { email, role, name }, { req, userId: newUser._id, userRole: role, userName: name });
    const { password: _, _id, ...rest } = newUser;
    res.status(201).json({ user: { id: _id, ...rest }, token });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await col('users').findOne({ email });
    if (!user) {
      auditLog(AUDIT.LOGIN_FAILED, { email, reason: 'user_not_found' }, { req });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      auditLog(AUDIT.LOGIN_FAILED, { email, reason: 'wrong_password' }, { req, userId: user._id, userRole: user.role, userName: user.name });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    auditLog(AUDIT.LOGIN_SUCCESS, { email }, { req, userId: user._id, userRole: user.role, userName: user.name });
    const { password: _, _id, ...rest } = user;
    res.json({ user: { id: _id, ...rest }, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await col('users').findOne({ _id: req.user.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, _id, ...rest } = user;
  res.json({ id: _id, ...rest });
});

export default router;
