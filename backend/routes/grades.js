const express = require('express');
const db = require('../db/init');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Add a grade entry
router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const { class_id, student_id, assignment_name, score, max_score } = req.body;
  if (!class_id || !student_id || !assignment_name || score == null) {
    return res.status(400).json({ error: 'class_id, student_id, assignment_name, score are required' });
  }
  
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Class belongs to another teacher' });
  }

  const info = db
    .prepare(
      `INSERT INTO grades (class_id, student_id, assignment_name, score, max_score)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(class_id, student_id, assignment_name, score, max_score || 100);
  res.status(201).json({ id: info.lastInsertRowid });
});

// Get grades for a class
router.get('/', requireRole('teacher', 'admin', 'student'), (req, res) => {
  const { class_id } = req.query;
  if (!class_id) return res.status(400).json({ error: 'class_id is required' });
  
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Class belongs to another teacher' });
  }

  const rows = db
    .prepare(
      `SELECT g.*, u.name AS student_name FROM grades g
       JOIN users u ON u.id = g.student_id
       WHERE g.class_id = ? ORDER BY g.date DESC`
    )
    .all(class_id);
  res.json(rows);
});

module.exports = router;
