const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Ensure we point to the same DB as index.js (parent directory)
const dbPath = path.resolve(__dirname, '../tasks.db');
const db = new sqlite3.Database(dbPath);

const sampleTasks = [
    {
        fromName: 'Alice Johnson',
        fromPhone: '555-0123',
        category: 'Computer',
        priority: 'High',
        description: 'Fix laptop fan',
        status: 'New',
        createdAt: Date.now() - 3600000 // 1 hour ago
    },
    {
        fromName: 'Bob Smith',
        fromPhone: '555-0456',
        category: 'Car',
        priority: 'Medium',
        description: 'Buy car brake pads',
        status: 'In Progress',
        createdAt: Date.now() - 86400000 // 1 day ago
    },
    {
        fromName: 'Carol White',
        fromPhone: '',
        category: 'Home',
        priority: 'Low',
        description: 'Repair kitchen tap',
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
    },
    {
        fromName: 'Eve Davis',
        fromPhone: '555-9999',
        category: 'Other',
        priority: 'High',
        description: 'Urgent callback request',
        status: 'New',
        createdAt: Date.now()
    }
];

db.serialize(() => {
    // Ensure table exists
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

    // Check if empty
    db.get("SELECT count(*) as count FROM tasks", (err, row) => {
        if (err) {
            console.error("Error checking database:", err);
            return;
        }

        if (row.count > 0) {
            console.log("Database already has data. Skipping seed.");
            return;
        }

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
        console.log(`Seeded ${sampleTasks.length} tasks.`);
    });
});
// Close implicitly after queue drains, but best to be explicit if logic allows. 
// With async callbacks passed to serialize/get, typical close might race. 
// Sqlite3 queues queries so calling close() here works for queued ops? 
// Actually safe to just let process exit or close in callback. 
// For a simple script, we'll let it drain.
