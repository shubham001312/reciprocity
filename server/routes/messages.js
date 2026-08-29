import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET /api/messages/conversations — List user's conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const allMessages = await col('messages').find({
      $or: [{ from: userId }, { to: userId }]
    }).sort({ createdAt: -1 }).toArray();

    // Group by conversation partner
    const convMap = {};
    allMessages.forEach(m => {
      const partnerId = m.from === userId ? m.to : m.from;
      if (!convMap[partnerId] || new Date(m.createdAt) > new Date(convMap[partnerId].lastMessageAt)) {
        convMap[partnerId] = {
          partnerId,
          lastMessage: m.content,
          lastMessageAt: m.createdAt,
          unread: convMap[partnerId]?.unread || 0,
        };
      }
      if (m.to === userId && !m.read) {
        convMap[partnerId].unread = (convMap[partnerId].unread || 0) + 1;
      }
    });

    // Enrich with partner names
    const users = await col('users').find().toArray();
    const userMap = {};
    users.forEach(u => { userMap[u._id] = { name: u.name, role: u.role }; });

    const conversations = Object.values(convMap).map(c => ({
      ...c,
      partnerName: userMap[c.partnerId]?.name || 'Unknown',
      partnerRole: userMap[c.partnerId]?.role || '',
    })).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:userId — Get messages with a specific user
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.userId;

    const messages = await col('messages').find({
      $or: [
        { from: userId, to: otherId },
        { from: otherId, to: userId },
      ]
    }).sort({ createdAt: 1 }).toArray();

    // Mark unread messages as read
    await col('messages').updateMany(
      { from: otherId, to: userId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages — Send a message
router.post('/', authenticate, async (req, res) => {
  try {
    const { to, content } = req.body;
    if (!to || !content) return res.status(400).json({ error: 'Recipient and content required' });

    const message = {
      _id: `msg-${uuid().substring(0, 8)}`,
      from: req.user.id,
      to,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await col('messages').insertOne(message);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/unread/count — Get unread message count
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const count = await col('messages').countDocuments({
      to: req.user.id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
