const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new DatabaseSync(path.join(__dirname, 'db', 'edutrack.sqlite'));
const hash = (pw) => bcrypt.hashSync(pw, 8);

// First, delete any existing user with admin@edutrack.dev to avoid unique constraint
db.prepare('DELETE FROM users WHERE email = ?').run('admin@edutrack.dev');

// Insert the admin back
db.prepare(
  'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
).run('Ava Admin', 'admin@edutrack.dev', hash('admin123'), 'admin');

console.log('Admin user restored!');
