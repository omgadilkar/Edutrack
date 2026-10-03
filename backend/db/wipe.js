const path = require('path');
const { DatabaseSync: Database } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'edutrack.sqlite');
const db = new Database(DB_PATH);

try {
  db.exec('PRAGMA foreign_keys = OFF');
  
  // Clear all tables
  db.exec('DELETE FROM attendance');
  db.exec('DELETE FROM grades');
  db.exec('DELETE FROM enrollments');
  db.exec('DELETE FROM classes');
  db.exec('DELETE FROM notices');
  db.exec('DELETE FROM users');
  
  // Reset sqlite_sequence to restart IDs from 1
  db.exec('DELETE FROM sqlite_sequence');
  
  db.exec('PRAGMA foreign_keys = ON');

  // Insert exactly one admin
  const hash = bcrypt.hashSync('admin123', 8);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
    'Primary Admin', 'admin@edutrack.dev', hash, 'admin'
  );

  console.log('Database forcefully wiped and reset! Only Primary Admin remains.');
} catch (err) {
  console.error(err);
}
