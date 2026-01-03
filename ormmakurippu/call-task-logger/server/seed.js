const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.resolve(__dirname, 'tasks.db');
const db = new sqlite3.Database(dbPath);

const sampleTasks = [
    {
        fromName: 'Alice Johnson',
        fromPhone: '555-0123',
        category: 'Computer',
        priority: 'High',
        description: 'Laptop blue screened, needs data recovery.',
        status: 'New',
        createdAt: Date.now() - 3600000 // 1 hour ago
    },
    {
        fromName: 'Bob Smith',
        fromPhone: '555-0456',
        category: 'Car',
        priority: 'Medium',
        description: 'Check engine light is on.',
        status: 'In Progress',
        createdAt: Date.now() - 86400000 // 1 day ago
    },
    {
        fromName: 'Carol White',
        fromPhone: '',
        category: 'Home',
        priority: 'Low',
        description: 'Leaky faucet in the guest bathroom.',
        status: 'New',
        createdAt: Date.now() - 172800000 // 2 days ago
    },
    {
        fromName: 'Dave Brown',
        fromPhone: '555-0789',
        category: 'Other',
        priority: 'Medium',
        description: 'Need advice on gardening.',
        status: 'Done',
        createdAt: Date.now() - 604800000 // 1 week ago
    }
];

db.serialize(() => {
    // Ensure table exists just in case
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        createdAt INTEGER,
        fromName TEXT NOT NULL,
        fromPhone TEXT,
        category TEXT,
        priority TEXT,
        description TEXT NOT NULL,
        notes TEXT,
        status TEXT,
        updatedAt INTEGER
      )`);

    const stmt = db.prepare(`INSERT INTO tasks (
    id, createdAt, fromName, fromPhone, category, priority, description, notes, status, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    sampleTasks.forEach(task => {
        stmt.run(
            uuidv4(),
            task.createdAt,
            task.fromName,
            task.fromPhone,
            task.category,
            task.priority,
            task.description,
            '',
            task.status,
            task.createdAt
        );
    });

    stmt.finalize();
    console.log('Seed data inserted.');
});

db.close();
