const express = require('express');
const db = require('../db/init');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// List classes - admin sees all, teacher sees own, student sees enrolled
router.get('/', authRequired, (req, res) => {
  const { role, id } = req.user;
  let rows;
  if (role === 'admin') {
    rows = db
      .prepare(
        `SELECT c.*, u.name AS teacher_name
         FROM classes c LEFT JOIN users u ON u.id = c.teacher_id`
      )
      .all();
  } else if (role === 'teacher') {
    rows = db
      .prepare(
        `SELECT c.*, u.name AS teacher_name
         FROM classes c LEFT JOIN users u ON u.id = c.teacher_id
         WHERE c.teacher_id = ?`
      )
      .all(id);
  } else {
    rows = db
      .prepare(
        `SELECT c.*, u.name AS teacher_name
         FROM classes c
         JOIN enrollments e ON e.class_id = c.id
         LEFT JOIN users u ON u.id = c.teacher_id
         WHERE e.student_id = ?`
      )
      .all(id);
  }
  res.json(rows);
});

// Create class - admin only
router.post('/', authRequired, requireRole('admin'), (req, res) => {
  const { name, subject, teacher_id, schedule } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db
    .prepare('INSERT INTO classes (name, subject, teacher_id, schedule) VALUES (?, ?, ?, ?)')
    .run(name, subject || null, teacher_id || null, schedule || null);
  res.status(201).json({ id: info.lastInsertRowid, name, subject, teacher_id, schedule });
});

// Get students enrolled in a class - admin or the assigned teacher
router.get('/:id/students', authRequired, (req, res) => {
  const classId = req.params.id;
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your class' });
  }
  const students = db
    .prepare(
      `SELECT u.id, u.name, u.email
       FROM users u JOIN enrollments e ON e.student_id = u.id
       WHERE e.class_id = ?`
    )
    .all(classId);
  res.json(students);
});

// Enroll a student in a class - admin only
router.post('/:id/enroll', authRequired, requireRole('admin'), (req, res) => {
  const classId = req.params.id;
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });
  try {
    db.prepare('INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)').run(classId, student_id);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Student already enrolled' });
    }
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

module.exports = router;
