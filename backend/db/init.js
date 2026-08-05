const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { DatabaseSync: Database } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'edutrack.sqlite');
const isNew = !fs.existsSync(DB_PATH);

const db = new Database(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return; // already seeded

  const hash = (pw) => bcrypt.hashSync(pw, 8);

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );

  const admin = insertUser.run('Ava Admin', 'admin@edutrack.dev', hash('admin123'), 'admin');
  const teacher1 = insertUser.run('Mr. Sharma', 'sharma@edutrack.dev', hash('teacher123'), 'teacher');
  const teacher2 = insertUser.run('Ms. Rao', 'rao@edutrack.dev', hash('teacher123'), 'teacher');

  const students = [
    ['Aarav Mehta', 'aarav@edutrack.dev'],
    ['Diya Kapoor', 'diya@edutrack.dev'],
    ['Kabir Singh', 'kabir@edutrack.dev'],
    ['Isha Nair', 'isha@edutrack.dev'],
    ['Rohan Gupta', 'rohan@edutrack.dev'],
  ].map(([name, email]) => insertUser.run(name, email, hash('student123'), 'student'));

  const insertClass = db.prepare(
    'INSERT INTO classes (name, subject, teacher_id, schedule) VALUES (?, ?, ?, ?)'
  );
  const class1 = insertClass.run('Grade 10 - A', 'Mathematics', teacher1.lastInsertRowid, 'Mon/Wed/Fri 9:00 AM');
  const class2 = insertClass.run('Grade 10 - B', 'Science', teacher2.lastInsertRowid, 'Tue/Thu 11:00 AM');

  const insertEnrollment = db.prepare(
    'INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)'
  );
  students.forEach((s, i) => {
    insertEnrollment.run(class1.lastInsertRowid, s.lastInsertRowid);
    if (i % 2 === 0) insertEnrollment.run(class2.lastInsertRowid, s.lastInsertRowid);
  });

  console.log('Seeded database with sample admin, teachers, students, and classes.');
  console.log('Login credentials:');
  console.log('  Admin:   admin@edutrack.dev / admin123');
  console.log('  Teacher: sharma@edutrack.dev / teacher123');
  console.log('  Student: aarav@edutrack.dev / student123');
}

seed();

module.exports = db;
