import express from 'express';
import { db } from '../firebase.js'; // Adjust path if needed
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/rbac.js';
import { AdminController } from './admin.controller.js';
import { PrismaClient } from '@prisma/client';
import { upsertDemoUser, DEMO_USERS } from '../features/auth/demo-auth.service.js';

const controller = new AdminController();


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
router.get('/api/tasks', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'READ_ONLY']), (req, res) => controller.getTasks(req, res));

// Delete Task (Admin Only)
router.delete('/api/tasks/:id', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => controller.deleteTask(req, res));

// Create Task (Admin)
router.post('/api/tasks', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => controller.createTask(req, res));

// Update Task (Admin)
router.put('/api/tasks/:id', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => controller.updateTask(req, res));

// Get Audit Logs (Admin UI)
router.get('/api/audit-logs', verifyFirebaseToken, verifyRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => controller.getAuditLogs(req, res));


// ════════════════════════════════════════════════════════════════════════
// API Admin Routes (accessible at /api/admin/* via index.js)
// Separate router exported for /api/admin prefix
// ════════════════════════════════════════════════════════════════════════
const prisma = new PrismaClient();

// Guard: only demo admin emails can call demo admin endpoints
const demoadminGuard = (req, res, next) => {
    const adminEmails = (process.env.ADMIN_EMAILS || 'owner@demo.local').split(',').map(e => e.trim());
    if (!adminEmails.includes(req.user?.email)) {
        return res.status(403).json({ success: false, error: 'Forbidden: admin only' });
    }
    next();
};

const apiAdminRouter = express.Router();

// POST /api/admin/reset-demo
apiAdminRouter.post('/reset-demo', verifyFirebaseToken, demoadminGuard, async (req, res) => {
    if (process.env.DEMO_AUTH !== 'true') {
        return res.status(404).json({ success: false, error: 'Not found' });
    }
    try {
        const demoUserIds = Object.values(DEMO_USERS).map(u => u.id);

        // Delete demo data (order matters for FK constraints)
        await prisma.taskLabel.deleteMany({ where: { task: { user_id: { in: demoUserIds } } } });
        await prisma.task.deleteMany({ where: { user_id: { in: demoUserIds } } });
        await prisma.callLog.deleteMany({ where: { owner_user_id: { in: demoUserIds } } });
        await prisma.contact.deleteMany({ where: { owner_user_id: { in: demoUserIds } } });
        await prisma.project.deleteMany({ where: { created_by_user_id: { in: demoUserIds } } });
        await prisma.workspaceMember.deleteMany({ where: { user_id: { in: demoUserIds } } });
        await prisma.workspaceInvite.deleteMany({
            where: {
                OR: [
                    { invited_by_user_id: { in: demoUserIds } },
                    { email: { in: Object.keys(DEMO_USERS) } }
                ]
            }
        });
        await prisma.workspace.deleteMany({ where: { owner_user_id: { in: demoUserIds } } });
        await prisma.auditLog.deleteMany({ where: { user_id: { in: demoUserIds } } });
        await prisma.userEmail.deleteMany({ where: { user_id: { in: demoUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });

        // Re-create demo users fresh
        for (const email of Object.keys(DEMO_USERS)) {
            await upsertDemoUser(email);
        }

        console.log('[DEMO_AUTH] Demo data reset complete');
        return res.json({ success: true, message: 'Demo data reset complete' });
    } catch (err) {
        console.error('[DEMO_AUTH] reset-demo error:', err);
        return res.status(500).json({ success: false, error: 'Reset failed: ' + err.message });
    }
});

// GET /api/admin/audit-logs
apiAdminRouter.get('/audit-logs', verifyFirebaseToken, demoadminGuard, async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { created_at: 'desc' },
            take: 200,
            select: {
                id: true,
                user_id: true,
                action: true,
                entity_type: true,
                entity_id: true,
                ip: true,
                metadata: true,
                created_at: true,
            }
        });
        return res.json({ success: true, data: logs });
    } catch (err) {
        console.error('[Admin] audit-logs error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
    }
});

export { apiAdminRouter };
export default router;
