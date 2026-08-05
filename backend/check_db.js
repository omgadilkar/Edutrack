const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'db', 'edutrack.sqlite'));
const users = db.prepare('SELECT id, name, email, role FROM users').all();
console.log(users);
