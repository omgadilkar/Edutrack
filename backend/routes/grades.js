const express = require('express');
const db = require('../db/init');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function assertOwnsClass(req, res, classId) {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) {
    res.status(404).json({ error: 'Class not found' });
    return null;
  }
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    res.status(403).json({ error: 'Not your class' });
    return null;
  }
  return cls;
}

// Add a grade entry - teacher/admin
router.post('/', authRequired, requireRole('teacher', 'admin'), (req, res) => {
  const { class_id, student_id, assignment_name, score, max_score } = req.body;
  if (!class_id || !student_id || !assignment_name || score == null) {
    return res.status(400).json({ error: 'class_id, student_id, assignment_name, score are required' });
  }
  if (!assertOwnsClass(req, res, class_id)) return;
  const info = db
    .prepare(
      `INSERT INTO grades (class_id, student_id, assignment_name, score, max_score)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(class_id, student_id, assignment_name, score, max_score || 100);
  res.status(201).json({ id: info.lastInsertRowid });
});

// Get grades for a class - teacher/admin
router.get('/', authRequired, requireRole('teacher', 'admin'), (req, res) => {
  const { class_id } = req.query;
  if (!class_id) return res.status(400).json({ error: 'class_id is required' });
  if (!assertOwnsClass(req, res, class_id)) return;
  const rows = db
    .prepare(
      `SELECT g.*, u.name AS student_name FROM grades g
       JOIN users u ON u.id = g.student_id
       WHERE g.class_id = ? ORDER BY g.date DESC`
    )
    .all(class_id);
  res.json(rows);
});

// Student's own grades
router.get('/mine', authRequired, requireRole('student'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT g.*, c.name AS class_name FROM grades g
       JOIN classes c ON c.id = g.class_id
       WHERE g.student_id = ? ORDER BY g.date DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

module.exports = router;
