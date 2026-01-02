import 'dotenv/config'; // Load env vars first
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { google } from 'googleapis';
import { db, auth as firebaseAuth } from './firebase.js';
import { uploadToDrive } from './drive.js';
import { validate, taskSchema } from './validate.js';
import { Categories, Priorities, Statuses } from './schema.js';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Google OAuth Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Middleware: Verify Google ID Token (Firebase Auth)
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// Routes

// Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Meta
app.get('/api/meta', (req, res) => {
    res.json({
        categories: Object.values(Categories),
        priorities: Object.values(Priorities),
        statuses: Object.values(Statuses)
    });
});

// Auth: Start Google OAuth Flow
app.get('/api/auth/google', (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Required for refresh_token
        scope: scopes,
        state: userId, // Pass userId to callback
        prompt: 'consent' // Force consent to ensure refresh_token
    });

    res.json({ url });
});

// Auth: Callback
app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state } = req.query; // state is userId

    if (!code || !state) {
        return res.status(400).send('Invalid request: Missing code or state');
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Store tokens in Firestore under the user's document
        // We use the 'state' parameter which contains the userId passed from the initiation step
        const userId = state;

        await db.collection('users').doc(userId).set({
            googleDriveConnected: true,
            tokens: tokens,
            updatedAt: Date.now()
        }, { merge: true });

        // Redirect back to frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}?drive_connected=true`);
    } catch (error) {
        console.error('OAuth Callback Error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Drive: Upload
app.post('/api/drive/upload', verifyAuth, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        // 1. Get User's Tokens
        const userRef = db.collection('users').doc(req.user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists || !userDoc.data()?.tokens) {
            return res.status(403).json({ error: 'User not connected to Google Drive. Please connect first.' });
        }

        const storedTokens = userDoc.data().tokens;

        // 2. Setup OAuth
        oauth2Client.setCredentials(storedTokens);

        // 3. Upload
        const result = await uploadToDrive(oauth2Client, req.file);
        res.json(result);
    } catch (error) {
        console.error('Upload Error:', error);
        // If error is related to auth, we might want to flag it
        if (error.message?.includes('invalid_grant')) {
            return res.status(401).json({ error: 'Google Drive session expired. Please reconnect.' });
        }
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Tasks - List
app.get('/api/tasks', async (req, res) => {
    try {
        const { search, status, priority, category } = req.query;
        let query = db.collection('tasks');

        if (status) query = query.where('status', '==', status);
        if (priority) query = query.where('priority', '==', priority);
        if (category) query = query.where('category', '==', category);

        const snapshot = await query.get(); // Firestore doesn't support generic string search like SQL 'LIKE' natively efficiently without Algolia etc.
        // We will fetch and filter in memory for simple search, or rely on client side filtering.
        // Given complexity constraint, let's filter in memory for 'search'.

        let tasks = snapshot.docs.map(doc => doc.data());

        if (search) {
            const lowerSearch = search.toLowerCase();
            tasks = tasks.filter(t =>
                t.description?.toLowerCase().includes(lowerSearch) ||
                t.fromName?.toLowerCase().includes(lowerSearch) ||
                t.notes?.toLowerCase().includes(lowerSearch)
            );
        }

        // Sort by createdAt descending
        tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Tasks - Get One
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const doc = await db.collection('tasks').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Task not found' });
        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// Tasks - Create
app.post('/api/tasks', validate(taskSchema), async (req, res) => {
    try {
        const id = randomUUID();
        const now = Date.now();
        const newTask = {
            id,
            createdAt: now,
            updatedAt: now,
            ...req.body
        };

        await db.collection('tasks').doc(id).set(newTask);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Tasks - Update
app.put('/api/tasks/:id', validate(taskSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const taskRef = db.collection('tasks').doc(id);
        const doc = await taskRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Task not found' });

        const updates = {
            updatedAt: Date.now(),
            ...req.body
        };

        await taskRef.update(updates);
        const updatedDoc = await taskRef.get();
        res.json(updatedDoc.data());
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Tasks - Delete
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const taskRef = db.collection('tasks').doc(id);
        const doc = await taskRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Task not found' });

        await taskRef.delete();
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Export CSV
app.get('/api/export', async (req, res) => {
    try {
        const snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
        const tasks = snapshot.docs.map(doc => doc.data());

        if (tasks.length === 0) {
            res.header('Content-Type', 'text/csv');
            res.attachment('tasks.csv');
            return res.send('id,createdAt,updatedAt,fromName,fromPhone,category,priority,description,notes,status\n');
        }

        const headers = Object.keys(tasks[0]).join(',');
        const rows = tasks.map(task => Object.values(task).map(val => {
            if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""'); // Handle arrays/objects
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(','));

        const csv = [headers, ...rows].join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment('tasks.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating CSV');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
