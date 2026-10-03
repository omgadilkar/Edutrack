const path = require('path');
const { DatabaseSync: Database } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'edutrack.sqlite');
const db = new Database(DB_PATH);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      author_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Seed initial notices if none exist
  const count = db.prepare('SELECT COUNT(*) AS c FROM notices').get().c;
  if (count === 0) {
    db.prepare("INSERT INTO notices (title, content, type, author_name) VALUES (?, ?, ?, ?)").run(
      'Exam Schedule Released', 'Final exams begin next month. Please check the portal for timetables.', 'primary', 'Admin Dept'
    );
    db.prepare("INSERT INTO notices (title, content, type, author_name) VALUES (?, ?, ?, ?)").run(
      'System Maintenance', 'ERP will be down at midnight for routine maintenance.', 'warning', 'IT Support'
    );
    db.prepare("INSERT INTO notices (title, content, type, author_name) VALUES (?, ?, ?, ?)").run(
      'Holiday Notice', 'Campus closed this Friday for state holiday.', 'success', 'Admin Dept'
    );
  }
  
  console.log("Notices table created and seeded.");
} catch (err) {
  console.error("Migration failed:", err);
}
