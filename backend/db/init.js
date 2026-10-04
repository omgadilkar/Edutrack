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
  const hash = (pw) => bcrypt.hashSync(pw, 8);

  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );

  insertUser.run('Primary Admin', 'admin@edutrack.dev', hash('admin123'), 'admin');
  insertUser.run('Mr. Sharma', 'sharma@edutrack.dev', hash('teacher123'), 'teacher');
  insertUser.run('Aarav Patel', 'aarav@edutrack.dev', hash('student123'), 'student');

  console.log('Seeded database with demo accounts (if not already present).');
  console.log('Login credentials:');
  console.log('  Admin:   admin@edutrack.dev / admin123');
  console.log('  Teacher: sharma@edutrack.dev / teacher123');
  console.log('  Student: aarav@edutrack.dev / student123');
}

seed();

module.exports = db;
