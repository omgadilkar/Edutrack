const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/init');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// List users (optionally filter by role) - admin only
router.get('/', authRequired, requireRole('admin'), (req, res) => {
  const { role } = req.query;
  const rows = role
    ? db.prepare('SELECT id, name, email, role, created_at FROM users WHERE role = ?').all(role)
    : db.prepare('SELECT id, name, email, role, created_at FROM users').all();
  res.json(rows);
});

// Create a user (teacher or student) - admin only
router.post('/', authRequired, requireRole('admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, role are required' });
  }
  if (!['admin', 'teacher', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email must contain an @ symbol' });
  }

  const alphaCount = (password.match(/[a-zA-Z]/g) || []).length;
  const numCount = (password.match(/[0-9]/g) || []).length;
  if (password.length !== 8 || alphaCount !== 3 || numCount !== 5) {
    return res.status(400).json({ error: 'Password must be exactly 8 characters long, containing 3 letters and 5 numbers' });
  }
  try {
    const hash = bcrypt.hashSync(password, 8);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, hash, role);
    res.status(201).json({ id: info.lastInsertRowid, name, email, role });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete a user - admin only
router.delete('/:id', authRequired, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
