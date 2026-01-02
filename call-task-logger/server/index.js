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
    updatedAt INTEGER
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

// Routes

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
  const { search, status, category, priority, start, end } = req.query;
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

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
  // Optional date filter
  if (start && end) {
      // Assuming start/end are timestamps or we parse them. 
      // For simplicity, skipping complex date math unless requested.
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
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
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

    db.run(query, params, function(err) {
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
            if(err) {
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
    db.run("DELETE FROM tasks WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.json({ message: 'Deleted successfully' });
    });
});

// GET /api/export
app.get('/api/export', (req, res) => {
    const csvStringifier = createObjectCsvStringifier({
        header: [
            {id: 'createdAt', title: 'Created At'},
            {id: 'fromName', title: 'From Name'},
            {id: 'fromPhone', title: 'Phone'},
            {id: 'category', title: 'Category'},
            {id: 'priority', title: 'Priority'},
            {id: 'status', title: 'Status'},
            {id: 'description', title: 'Description'},
            {id: 'notes', title: 'Notes'},
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
