const express = require('express');
const db = require('../db/init');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Mark/update attendance for a student on a date
router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const { class_id, student_id, date, status } = req.body;
  if (!class_id || !student_id || !date || !status) {
    return res.status(400).json({ error: 'class_id, student_id, date, status are required' });
  }
  
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Class belongs to another teacher' });
  }

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

// Bulk mark attendance
router.post('/bulk', requireRole('teacher', 'admin'), (req, res) => {
  const { class_id, date, records } = req.body;
  if (!class_id || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'class_id, date, records array are required' });
  }

  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Class belongs to another teacher' });
  }

  const stmt = db.prepare(`
    INSERT INTO attendance (class_id, student_id, date, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(class_id, student_id, date) DO UPDATE SET status = excluded.status
  `);

  try {
    db.exec('BEGIN TRANSACTION');
    for (const rec of records) {
      if (['present', 'absent', 'late', 'excused'].includes(rec.status)) {
        stmt.run(class_id, rec.student_id, date, rec.status);
      }
    }
    db.exec('COMMIT');
    res.json({ success: true });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Database error during bulk save' });
  }
});

// Admin report for attendance with filters
router.get('/report', requireRole('admin'), (req, res) => {
  const { department, course, semester, division, subject } = req.query;
  let whereClauses = [];
  let params = [];
  
  if (department) { whereClauses.push('c.department = ?'); params.push(department); }
  if (course) { whereClauses.push('c.course = ?'); params.push(course); }
  if (semester) { whereClauses.push('c.semester = ?'); params.push(semester); }
  if (division) { whereClauses.push('c.division = ?'); params.push(division); }
  if (subject) { whereClauses.push('c.subject = ?'); params.push(subject); }
  
  const whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  
  // Calculate attendance per student based on filtered classes
  const rows = db.prepare(`
    SELECT u.id as student_id, u.name as student_name, u.student_number,
           COUNT(a.id) as total_classes,
           SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) as present_classes
    FROM users u
    JOIN enrollments e ON u.id = e.student_id
    JOIN classes c ON e.class_id = c.id
    JOIN attendance a ON a.student_id = u.id AND a.class_id = c.id
    ${whereSql}
    GROUP BY u.id
    ORDER BY u.name
  `).all(...params);
  
  res.json(rows);
});

// Get attendance for a class on a date
router.get('/', requireRole('teacher', 'admin', 'student'), (req, res) => {
  const { class_id, date } = req.query;
  
  if (!class_id) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Only admins can view all attendance without specifying class_id' });
    }
    const rows = db.prepare(`
      SELECT a.*, u.name AS student_name, c.name AS class_name, c.subject
      FROM attendance a
      JOIN users u ON u.id = a.student_id
      JOIN classes c ON c.id = a.class_id
      ORDER BY a.date DESC
    `).all();
    return res.json(rows);
  }
  
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Class belongs to another teacher' });
  }

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

// Get attendance for a specific student
router.get('/student/:id', requireRole('student', 'admin', 'teacher'), (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: 'Access denied: Cannot view other students attendance' });
  }

  const rows = db.prepare(`
    SELECT a.*, c.name AS class_name, c.subject, c.teacher_id, u.name AS teacher_name
    FROM attendance a
    JOIN classes c ON c.id = a.class_id
    LEFT JOIN users u ON u.id = c.teacher_id
    WHERE a.student_id = ?
    ORDER BY a.date DESC
  `).all(studentId);
  res.json(rows);
});

module.exports = router;
