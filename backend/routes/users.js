const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/init');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// List users (optionally filter by role) - admin, teacher
router.get('/', requireRole('admin', 'teacher'), (req, res) => {
  const { role } = req.query;
  
  if (req.user.role === 'teacher') {
    // A teacher can only see students who are enrolled in their classes
    const stmt = db.prepare(`
      SELECT DISTINCT u.id, u.name, u.email, u.role, u.student_number, u.phone, u.parent_phone, u.created_at
      FROM users u
      JOIN enrollments e ON e.student_id = u.id
      JOIN classes c ON c.id = e.class_id
      WHERE c.teacher_id = ? ${role ? 'AND u.role = ?' : ''}
    `);
    
    const rows = role ? stmt.all(req.user.id, role) : stmt.all(req.user.id);
    return res.json(rows);
  }

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

module.exports = router;
