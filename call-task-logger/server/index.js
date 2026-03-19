const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const { createObjectCsvStringifier } = require('csv-writer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

const CURRENT_USER_ID = 'local_user';

// Database Setup
const dbPath = path.resolve(__dirname, 'tasks.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
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
    updatedAt INTEGER,
    deletedAt INTEGER DEFAULT NULL
  )`);

  // Migration for existing tables
  db.run("ALTER TABLE tasks ADD COLUMN deletedAt INTEGER DEFAULT NULL", (err) => {
    // Ignore error if column already exists
  });

  // Comments table
  db.run(`CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    deleted_at INTEGER DEFAULT NULL,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link_url TEXT,
    created_at INTEGER NOT NULL,
    read_at INTEGER DEFAULT NULL
  )`);
});

// Validation Schemas
const taskSchema = z.object({
  fromName: z.string().min(1, 'Name is required'),
  fromPhone: z.string().optional(),
  category: z.enum(['Computer', 'Car', 'Home', 'Other']).default('Other'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  status: z.enum(['New', 'In Progress', 'Done']).default('New'),
});

const updateTaskSchema = taskSchema.partial();

const commentSchema = z.object({
  author_name: z.string().min(1, 'Author name is required'),
  body: z.string().min(1, 'Comment body is required'),
});

const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  link_url: z.string().optional(),
  created_at: z.number(),
  read_at: z.number().nullable().optional(),
});

// Helper to create notifications
function createNotification({ type, title, body, link_url = '', user_id = CURRENT_USER_ID }) {
  const id = uuidv4();
  const now = Date.now();
  const stmt = db.prepare(`INSERT INTO notifications (
    id, user_id, type, title, body, link_url, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  stmt.run(id, user_id, type, title, body, link_url, now, (err) => {
    if (err) console.error('Error creating notification:', err.message);
  });
  stmt.finalize();
}

// Routes

// GET /api/notifications
app.get('/api/notifications', (req, res) => {
  db.all(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [CURRENT_USER_ID],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// POST /api/notifications/:id/read
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const now = Date.now();
  db.run(
    "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?",
    [now, id, CURRENT_USER_ID],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }
      res.json({ success: true, read_at: now });
    }
  );
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', (req, res) => {
  const now = Date.now();
  db.run(
    "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
    [now, CURRENT_USER_ID],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, count: this.changes });
    }
  );
});

// Routes

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
  const { search, status, category, priority, start, end, includeDeleted } = req.query;
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (includeDeleted === 'true') {
    query += " AND deletedAt IS NOT NULL";
  } else {
    query += " AND deletedAt IS NULL";
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (priority) {
    query += " AND priority = ?";
    params.push(priority);
  }
  if (search) {
    query += " AND (fromName LIKE ? OR description LIKE ? OR fromPhone LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  query += " ORDER BY createdAt DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(row);
  });
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  try {
    const data = taskSchema.parse(req.body);
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`INSERT INTO tasks (
      id, createdAt, fromName, fromPhone, category, priority, description, notes, status, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    stmt.run(
      id, now, data.fromName, data.fromPhone || '', data.category, data.priority,
      data.description, data.notes || '', data.status, now,
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Trigger notification if assigned (simulated logic for demo)
        // Note: In a real app we'd check if assignedTo changed or is set
        if (req.body.assignedTo) {
          createNotification({
            type: 'assigned_to_you',
            title: 'Task Assigned',
            body: `You were assigned a new task: ${data.fromName}`,
            link_url: `/#task-${id}`
          });
        }

        // Simple check for comment mentions simulated in notes
        if (data.notes && data.notes.includes('@name')) {
          createNotification({
            type: 'comment_mention',
            title: 'Mentioned in Notes',
            body: `You were mentioned in a task: ${data.fromName}`,
            link_url: `/#task-${id}`
          });
        }

        res.status(201).json({ id, ...data, createdAt: now, updatedAt: now });
      }
    );
    stmt.finalize();

  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const { id } = req.params;
    const now = Date.now();

    // Construct dynamic update query
    const fields = [];
    const params = [];

    Object.keys(data).forEach(key => {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    });

    fields.push("updatedAt = ?");
    params.push(now);
    params.push(id);

    if (fields.length === 1) { // Only updatedAt
      return res.status(400).json({ error: "No fields to update" });
    }

    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;

    db.run(query, params, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      // Return updated task
      db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
        if (err) {
          res.json({ success: true, id }); // Fallback
        } else {
          res.json(row);
        }
      });
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const now = Date.now();
  db.run("UPDATE tasks SET deletedAt = ? WHERE id = ?", [now, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Moved to trash' });
  });
});

// POST /api/tasks/:id/restore
app.post('/api/tasks/:id/restore', (req, res) => {
  const { id } = req.params;
  db.run("UPDATE tasks SET deletedAt = NULL WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Restored successfully' });
  });
});

// GET /api/export
app.get('/api/export', (req, res) => {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'createdAt', title: 'Created At' },
      { id: 'fromName', title: 'From Name' },
      { id: 'fromPhone', title: 'Phone' },
      { id: 'category', title: 'Category' },
      { id: 'priority', title: 'Priority' },
      { id: 'status', title: 'Status' },
      { id: 'description', title: 'Description' },
      { id: 'notes', title: 'Notes' },
    ]
  });

  db.all("SELECT * FROM tasks ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) {
      res.status(500).send("Error exporting data");
      return;
    }
    const formattedRows = rows.map(r => ({
      ...r,
      createdAt: new Date(r.createdAt).toLocaleString()
    }));

    const header = csvStringifier.getHeaderString();
    const records = csvStringifier.stringifyRecords(formattedRows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
    res.send(header + records);
  });
});

// ─── Comments Endpoints ────────────────────────────────────────────────────

// Helper: load task ensuring it exists and is not deleted
function getActiveTask(id, cb) {
  db.get("SELECT * FROM tasks WHERE id = ? AND deletedAt IS NULL", [id], (err, row) => {
    if (err) return cb(err);
    if (!row) return cb(null, null);
    cb(null, row);
  });
}

// GET /api/tasks/:id/comments
app.get('/api/tasks/:id/comments', (req, res) => {
  const { id } = req.params;
  getActiveTask(id, (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.all(
      "SELECT * FROM task_comments WHERE task_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
      [id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  });
});

// POST /api/tasks/:id/comments
app.post('/api/tasks/:id/comments', (req, res) => {
  const { id } = req.params;
  try {
    const data = commentSchema.parse(req.body);
    getActiveTask(id, (err, task) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const commentId = uuidv4();
      const now = Date.now();
      db.run(
        "INSERT INTO task_comments (id, task_id, author_name, body, created_at) VALUES (?, ?, ?, ?, ?)",
        [commentId, id, data.author_name, data.body, now],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({
            id: commentId,
            task_id: id,
            author_name: data.author_name,
            body: data.body,
            created_at: now,
            deleted_at: null,
          });
        }
      );
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/comments/:id  (soft delete)
app.delete('/api/comments/:id', (req, res) => {
  const { id } = req.params;
  const { author_name } = req.body || {};

  if (!author_name || !author_name.trim()) {
    return res.status(400).json({ error: 'author_name is required' });
  }

  // Load the comment
  db.get("SELECT * FROM task_comments WHERE id = ? AND deleted_at IS NULL", [id], (err, comment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Load the parent task to check owner
    db.get("SELECT * FROM tasks WHERE id = ?", [comment.task_id], (err, task) => {
      if (err) return res.status(500).json({ error: err.message });

      const isOwner = task && task.fromName === author_name.trim();
      const isAuthor = comment.author_name === author_name.trim();

      if (!isOwner && !isAuthor) {
        return res.status(403).json({ error: 'Forbidden: you can only delete your own comments' });
      }

      const now = Date.now();
      db.run("UPDATE task_comments SET deleted_at = ? WHERE id = ?", [now, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Comment deleted' });
      });
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
