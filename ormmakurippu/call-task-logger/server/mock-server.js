const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10kb' }));

let tasks = [
    {
        id: '1',
        createdAt: Date.now(),
        fromName: 'Test User',
        fromPhone: '1234567890',
        category: 'Other',
        priority: 'Medium',
        description: 'Initial seed task',
        notes: '',
        status: 'New',
        updatedAt: Date.now()
    }
];

const taskSchema = z.object({
    fromName: z.string().trim().min(1, 'Name is required'),
    fromPhone: z.string().trim().optional(),
    category: z.enum(['Computer', 'Car', 'Home', 'Other']).default('Other'),
    priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
    description: z.string().trim().min(1, 'Description is required'),
    notes: z.string().trim().optional(),
    status: z.enum(['New', 'In Progress', 'Done']).default('New'),
});

const updateTaskSchema = taskSchema.partial();

app.get('/api/tasks', (req, res) => {
    // simplified filter
    res.json(tasks.sort((a, b) => b.createdAt - a.createdAt));
});

app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

app.post('/api/tasks', (req, res) => {
    try {
        const data = taskSchema.parse(req.body);
        const newTask = {
            id: uuidv4(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...data,
            fromPhone: data.fromPhone || '',
            notes: data.notes || '',
        };
        tasks.push(newTask);
        res.status(201).json(newTask);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.put('/api/tasks/:id', (req, res) => {
    try {
        const idx = tasks.findIndex(t => t.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Task not found' });

        const data = updateTaskSchema.parse(req.body);
        tasks[idx] = { ...tasks[idx], ...data, updatedAt: Date.now() };
        res.json(tasks[idx]);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    const idx = tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });
    tasks.splice(idx, 1);
    res.json({ message: 'Deleted' });
});

app.listen(PORT, () => {
    console.log(`Mock Server running on http://localhost:${PORT}`);
});
