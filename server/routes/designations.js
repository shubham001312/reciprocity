import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET /api/designations — List all requests (admin sees all, users see own)
router.get('/', authenticate, async (req, res) => {
  const filter = {};
  if (req.user.role !== 'admin') filter.userId = req.user.id;
  const requests = await col('designations').find(filter).sort({ createdAt: -1 }).toArray();
  // Enrich with user and college info
  const users = await col('users').find().toArray();
  const colleges = await col('colleges').find().toArray();
  const enriched = requests.map(r => {
    const user = users.find(u => u._id === r.userId);
    const college = colleges.find(c => c._id === r.collegeId);
    return {
      ...r,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || '',
      userRole: user?.role || '',
      collegeName: college?.name || 'Unknown',
      collegeCode: college?.code || '',
    };
  });
  res.json(enriched);
});

// POST /api/designations — Request to join a college
router.post('/', authenticate, async (req, res) => {
  const { collegeId, department, designation, message } = req.body;
  if (!collegeId) return res.status(400).json({ error: 'College is required' });

  const college = await col('colleges').findOne({ _id: collegeId });
  if (!college) return res.status(404).json({ error: 'College not found' });

  // Check if already has a pending request
  const existing = await col('designations').findOne({ userId: req.user.id, collegeId, status: 'pending' });
  if (existing) return res.status(409).json({ error: 'You already have a pending request for this college' });

  const request = {
    _id: `des-${uuid().substring(0, 8)}`,
    userId: req.user.id,
    collegeId,
    department: department || '',
    designation: designation || req.user.role,
    message: message || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNote: '',
  };
  await col('designations').insertOne(request);
  res.status(201).json(request);
});

// PUT /api/designations/:id/approve — Admin approves
router.put('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  const { reviewNote } = req.body;
  const request = await col('designations').findOne({ _id: req.params.id });
  if (!request) return res.status(404).json({ error: 'Request not found' });

  await col('designations').updateOne({ _id: req.params.id }, { $set: {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.user.id,
    reviewNote: reviewNote || '',
  }});

  // Update user's collegeId, department
  await col('users').updateOne({ _id: request.userId }, { $set: {
    collegeId: request.collegeId,
    department: request.department || undefined,
  }});

  res.json({ message: 'Request approved', status: 'approved' });
});

// PUT /api/designations/:id/reject — Admin rejects
router.put('/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  const { reviewNote } = req.body;
  const request = await col('designations').findOne({ _id: req.params.id });
  if (!request) return res.status(404).json({ error: 'Request not found' });

  await col('designations').updateOne({ _id: req.params.id }, { $set: {
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.user.id,
    reviewNote: reviewNote || '',
  }});

  res.json({ message: 'Request rejected', status: 'rejected' });
});

// DELETE /api/designations/:id — Cancel own request
router.delete('/:id', authenticate, async (req, res) => {
  const request = await col('designations').findOne({ _id: req.params.id });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  await col('designations').deleteOne({ _id: req.params.id });
  res.json({ message: 'Request deleted' });
});

export default router;
