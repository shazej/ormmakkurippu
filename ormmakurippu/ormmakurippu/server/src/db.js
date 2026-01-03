import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || 'tasks.db';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    fromName TEXT NOT NULL,
    fromPhone TEXT,
    category TEXT NOT NULL DEFAULT 'Other',
    priority TEXT NOT NULL DEFAULT 'Medium',
    description TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'New'
  )
`);

export default db;
