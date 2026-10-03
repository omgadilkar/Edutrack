const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/init');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// List users (optionally filter by role) - admin, teacher
router.get('/', requireRole('admin', 'teacher'), (req, res) => {
  const { role } = req.query;
  
  // Teachers and admins can see all users (or filter by role) to allow for enrollment


  const rows = role
    ? db.prepare('SELECT id, name, email, role, student_number, phone, parent_phone, created_at FROM users WHERE role = ?').all(role)
    : db.prepare('SELECT id, name, email, role, student_number, phone, parent_phone, created_at FROM users').all();
  res.json(rows);
});

// Create a user (teacher or student) - admin only
router.post('/', requireRole('admin'), (req, res) => {
  const { name, email, role, student_number, phone, parent_phone } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'name, email, role are required' });
  }
  if (!['admin', 'teacher', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email must contain an @ symbol' });
  }

  try {
    const hash = bcrypt.hashSync('dummy123', 8);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, role, student_number, phone, parent_phone) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(name, email, hash, role, student_number || null, phone || null, parent_phone || null);
    res.status(201).json({ id: info.lastInsertRowid, name, email, role, student_number, phone, parent_phone });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete a user - admin only
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Update a user - admin only
router.put('/:id', requireRole('admin'), (req, res) => {
  const { name, email, student_number, phone, parent_phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email must contain an @ symbol' });
  }

  try {
    const info = db
      .prepare('UPDATE users SET name = ?, email = ?, student_number = ?, phone = ?, parent_phone = ? WHERE id = ?')
      .run(name, email, student_number || null, phone || null, parent_phone || null, req.params.id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
