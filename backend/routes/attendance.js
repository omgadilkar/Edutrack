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

// Mark/update attendance for a student on a date - teacher/admin
router.post('/', authRequired, requireRole('teacher', 'admin'), (req, res) => {
  const { class_id, student_id, date, status } = req.body;
  if (!class_id || !student_id || !date || !status) {
    return res.status(400).json({ error: 'class_id, student_id, date, status are required' });
  }
  if (!assertOwnsClass(req, res, class_id)) return;
  if (!['present', 'absent', 'late', 'excused'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare(
    `INSERT INTO attendance (class_id, student_id, date, status)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(class_id, student_id, date) DO UPDATE SET status = excluded.status`
  ).run(class_id, student_id, date, status);
  res.json({ success: true });
});

// Get attendance for a class on a date - teacher/admin
router.get('/', authRequired, requireRole('teacher', 'admin'), (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id) return res.status(400).json({ error: 'class_id is required' });
  if (!assertOwnsClass(req, res, class_id)) return;
  const rows = date
    ? db
        .prepare(
          `SELECT a.*, u.name AS student_name FROM attendance a
           JOIN users u ON u.id = a.student_id
           WHERE a.class_id = ? AND a.date = ?`
        )
        .all(class_id, date)
    : db
        .prepare(
          `SELECT a.*, u.name AS student_name FROM attendance a
           JOIN users u ON u.id = a.student_id
           WHERE a.class_id = ? ORDER BY a.date DESC`
        )
        .all(class_id);
  res.json(rows);
});

// Student's own attendance
router.get('/mine', authRequired, requireRole('student'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, c.name AS class_name FROM attendance a
       JOIN classes c ON c.id = a.class_id
       WHERE a.student_id = ? ORDER BY a.date DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

module.exports = router;
