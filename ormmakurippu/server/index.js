import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
// Routes
app.get('/', (req, res) => {
    res.send('ormmakurippu API is running');
});

app.get('/api/tasks', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
        const tasks = stmt.all();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const { title, description, fromName, fromPhone, category, priority, status, notes } = req.body;
        const stmt = db.prepare(`
            INSERT INTO tasks (title, description, fromName, fromPhone, category, priority, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(title, description || '', fromName || '', fromPhone || '', category || 'General', priority || 'Medium', status || 'Pending', notes || '');
        res.status(201).json({
            id: info.lastInsertRowid,
            title,
            description,
            fromName,
            fromPhone,
            category,
            priority,
            status,
            notes,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tasks/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
        const task = stmt.get(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tasks/:id', (req, res) => {
    try {
        const { title, description, fromName, fromPhone, category, priority, status, notes } = req.body;
        const stmt = db.prepare(`
            UPDATE tasks 
            SET title = ?, description = ?, fromName = ?, fromPhone = ?, category = ?, priority = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        const info = stmt.run(title, description, fromName, fromPhone, category, priority, status, notes, req.params.id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ id: req.params.id, message: 'Task updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        const info = stmt.run(req.params.id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
