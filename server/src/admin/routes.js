import express from 'express';
import { db } from '../firebase.js'; // Adjust path if needed
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/rbac.js';
import { logAudit } from './audit.js';
import { logSystemEvent } from './system-log.js';

const router = express.Router();

// --- UI Routes ---

// Login Page
router.get('/login', (req, res) => {
    // If already logged in, redirect to dashboard? 
    // Need client-side check or cookie check here.
    if (req.cookies && req.cookies.session) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/views/login');
});

// Dashboard (Protected)
router.get('/dashboard', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'READ_ONLY']), async (req, res) => {
    res.render('admin/views/dashboard', { user: req.user });
});

// Tasks List (Protected)
router.get('/tasks', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'READ_ONLY']), async (req, res) => {
    res.render('admin/views/tasks', { user: req.user });
});

// Task Detail / Create (Protected)
router.get('/tasks/:id', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'READ_ONLY']), async (req, res) => {
    const { id } = req.params;
    let task = null;
    if (id !== 'new') {
        const doc = await db.collection('tasks').doc(id).get();
        if (doc.exists) {
            task = { id: doc.id, ...doc.data() };
        }
    }
    res.render('admin/views/task-detail', { user: req.user, task });
});

// Logs (Protected, Admin Only)
router.get('/logs', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    res.render('admin/views/logs', { user: req.user });
});

// --- API Routes (Used by Admin UI) ---

// Login Action (Exchange ID Token for Cookie)
router.post('/auth/login', async (req, res) => {
    const { idToken } = req.body;
    // In a real app, verify ID token here, then create a Session Cookie.
    // For MVP/Demo, we might just set the ID Token AS the cookie (short lived).
    // Firebase Admin SDK `createSessionCookie` is best practice but requires valid Service Account.
    // We will stick to simple cookie logic for now.

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production' };

    res.cookie('session', idToken, options);

    // Log login
    // We need to decode token to look up user... verifyFirebaseToken middleware does this, but we are in a POST handler.
    // Let's assume validation happened or will happen on next request.
    // Ideally we verify HERE before setting cookie.

    res.json({ status: 'success' });
});

router.post('/auth/logout', (req, res) => {
    res.clearCookie('session');
    res.json({ status: 'success' });
});

// Get Tasks (Admin Scope)
router.get('/api/tasks', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'READ_ONLY']), async (req, res) => {
    try {
        const snapshot = await db.collection('tasks').orderBy('created_at', 'desc').get();
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(tasks);
    } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Task (Admin Only)
router.delete('/api/tasks/:id', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('tasks').doc(id).delete();

        await logAudit(req.user, 'DELETE_TASK', 'task', id, { reason: 'Admin deletion' });

        res.json({ status: 'success' });
    } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Task (Admin)
router.post('/api/tasks', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        const data = req.body;
        const ref = await db.collection('tasks').add({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            createdBy: req.user.uid // Admin UID
        });

        await logAudit(req.user, 'CREATE_TASK', 'task', ref.id, { title: data.title });

        res.json({ id: ref.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Task (Admin)
router.put('/api/tasks/:id', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        await db.collection('tasks').doc(id).update({
            ...data,
            updated_at: new Date().toISOString()
        });

        await logAudit(req.user, 'UPDATE_TASK', 'task', id, { updates: Object.keys(data) });

        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Audit Logs
router.get('/api/audit-logs', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        const snapshot = await db.collection('audit_logs').orderBy('timestamp', 'desc').limit(100).get();
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
