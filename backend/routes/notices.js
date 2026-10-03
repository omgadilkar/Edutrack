const express = require('express');
const db = require('../db/init');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all notices (everyone can view)
router.get('/', (req, res) => {
  const notices = db.prepare('SELECT * FROM notices ORDER BY created_at DESC').all();
  res.json(notices);
});

// Create a notice (admin only)
router.post('/', requireRole('admin'), (req, res) => {
  const { title, content, type } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const info = db
      .prepare('INSERT INTO notices (title, content, type, author_name) VALUES (?, ?, ?, ?)')
      .run(title, content, type || 'info', req.user.name || 'Admin');
    
    const newNotice = db.prepare('SELECT * FROM notices WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newNotice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

// Delete a notice (admin only)
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM notices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
