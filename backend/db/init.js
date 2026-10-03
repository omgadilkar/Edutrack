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

  insertUser.run('Primary Admin', 'admin@edutrack.dev', hash('admin123'), 'admin');

  console.log('Seeded database with primary admin account only.');
  console.log('Login credentials:');
  console.log('  Admin:   admin@edutrack.dev / admin123');
}

seed();

module.exports = db;
