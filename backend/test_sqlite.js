const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
const stmt = db.prepare('INSERT INTO test (name) VALUES (?)');
const info = stmt.run('hello');
console.log(info);
console.log(db.prepare('SELECT * FROM test').get());
console.log(db.prepare('SELECT * FROM test').all());
