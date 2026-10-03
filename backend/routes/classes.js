const express = require('express');
const db = require('../db/init');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// List classes
router.get('/', requireRole('teacher', 'admin'), (req, res) => {
  if (req.user.role === 'teacher') {
    const rows = db.prepare(
      `SELECT c.*, u.name AS teacher_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS enrolled_count
       FROM classes c LEFT JOIN users u ON u.id = c.teacher_id
       WHERE c.teacher_id = ?`
    ).all(req.user.id);
    return res.json(rows);
  }
  
  const rows = db.prepare(
    `SELECT c.*, u.name AS teacher_name,
      (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS enrolled_count
     FROM classes c LEFT JOIN users u ON u.id = c.teacher_id`
  ).all();
  res.json(rows);
});

// Create class
router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const { name, department, course, semester, division, subject, teacher_id, schedule } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db
    .prepare('INSERT INTO classes (name, department, course, semester, division, subject, teacher_id, schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(name, department || null, course || null, semester || null, division || null, subject || null, teacher_id || null, schedule || null);
  res.status(201).json({ id: info.lastInsertRowid, name, department, course, semester, division, subject, teacher_id, schedule });
});

// Get students enrolled in a class
router.get('/:id/students', requireRole('teacher', 'admin'), (req, res) => {
  const classId = req.params.id;
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Class belongs to another teacher' });
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

// Enroll a student in a class
router.post('/:id/enroll', requireRole('teacher', 'admin'), (req, res) => {
  const classId = req.params.id;
  
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Class belongs to another teacher' });
  }

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
