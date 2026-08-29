import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';
import { sanitizeBody, maxLength } from '../utils/sanitize.js';

const router = Router();

// GET /api/notices — List notices (all users see, newest first)
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    const all = await col('notices').find(filter).sort({ createdAt: -1 }).toArray();
    const notices = all.slice(0, parseInt(limit));

    // Enrich with author name
    const users = await col('users').find().toArray();
    const userMap = {};
    users.forEach(u => { userMap[u._id] = u.name; });

    const enriched = notices.map(n => ({
      ...n,
      authorName: userMap[n.authorId] || 'System',
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notices — Create notice (admin/professor only)
router.post('/', authenticate, authorize('admin', 'professor'), sanitizeBody(['title', 'content']), maxLength(5000), async (req, res) => {
  try {
    const { title, content, category, priority } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const notice = {
      _id: `ntc-${uuid().substring(0, 8)}`,
      title,
      content,
      category: category || 'general',
      priority: priority || 'normal',
      authorId: req.user.id,
      authorRole: req.user.role,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    await col('notices').insertOne(notice);
    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notices/:id/read — Mark notice as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await col('notices').updateOne(
      { _id: req.params.id },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notices/:id — Delete notice (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await col('notices').deleteOne({ _id: req.params.id });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
