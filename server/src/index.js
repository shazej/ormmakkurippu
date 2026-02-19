import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import path from 'path';
import helmet from 'helmet';
import crypto from 'crypto';
import { apiLimiter, authLimiter } from './middleware/rate-limit.js';

import { fileURLToPath } from 'url';
import { db, auth } from './firebase.js';
import { verifyFirebaseToken } from './middleware/auth.js';
import { uploadToDrive, getOAuthClient } from './drive.js';
import { google } from 'googleapis';
import adminRoutes from './admin/routes.js';
import accountRoutes from './features/account/account.routes.js';
import securityRoutes from './features/security/security.routes.js';
import mfaRoutes from './features/mfa/mfa.routes.js';
import tasksRoutes from './features/tasks/tasks.routes.js';
import authRoutes from './features/auth/auth.routes.js';
import activityRoutes from './features/activity/activity.routes.js';
import privacyRoutes from './features/privacy/privacy.routes.js';
import complianceRoutes from './features/compliance/compliance.routes.js';
import usersRoutes from './features/users/users.routes.js';
import contactsRoutes from './features/contacts/contacts.routes.js';
import callsRoutes from './features/calls/calls.routes.js';
import workspacesRoutes from './features/workspaces/workspaces.routes.js';
import groupsRoutes from './features/groups/groups.routes.js';
import linkedAccountsRoutes from './features/linked-accounts/linked-accounts.routes.js';
import accountClosureRoutes from './features/account-closure/account-closure.routes.js';
import settingsRoutes from './features/settings/settings.routes.js';
import onboardingRoutes from './features/onboarding/onboarding.routes.js';

import { SecurityService } from './features/security/security.service.js';
import { UsersRepository } from './features/users/users.repository.js';
import { AllowedIpsRepository } from './features/security/security.repository.js';
import argon2 from 'argon2';
import { TasksService } from './features/tasks/tasks.service.js';
import { UsersController } from './features/users/users.controller.js';

const securityService = new SecurityService();
const usersRepository = new UsersRepository();
const allowedIpsRepository = new AllowedIpsRepository();
const usersController = new UsersController();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable Trust Proxy for Rate Limiting / GeoIP behind Load Balancers (e.g., Render, specialized hosts)
app.set('trust proxy', 1);

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
// 1. Request ID (Correlation)
app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// 2. Structured Logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            timestamp: new Date().toISOString(),
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };
        // Log errors/warnings more prominently
        if (res.statusCode >= 400) {
            console.warn(JSON.stringify(logData));
        } else if (process.env.NODE_ENV !== 'production') {
            // Reduced noise in prod for success
            console.log(JSON.stringify(logData));
        }
    });
    next();
});

// 3. Security Headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: false, // Disable for now if causing issues with specific libs
    strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    xFrameOptions: { action: 'deny' }
}));

// 4. CORS
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(cors({
    origin: (origin, callback) => {
        // Allow no origin (e.g. mobile apps, curl) or allowed origin
        if (!origin || origin === clientOrigin) {
            callback(null, true);
        } else {
            console.warn(`Blocked CORS for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Webhook handling (raw body) - MUST be before express.json()
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    // Placeholder for Stripe Webhook
    console.log('Stripe Webhook received');
    res.json({ received: true });
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Upload setup (Multer)
// Upload setup (Multer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDF, and office documents are allowed.'));
        }
    }
});

app.use('/api/users', usersRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/workspaces', workspacesRoutes);

// Reminder Loop (Simple In-Memory)
setInterval(async () => {
    try {
        const tasksService = new TasksService();
        const sent = await tasksService.processReminders();
        if (sent.length > 0) {
            console.log(`[Reminders] Sent ${sent.length} reminders:`, sent.map(t => `${t.id} (${t.title})`));
        }
    } catch (e) {
        // console.error('[Reminders] Error processing:', e); // Squelch mostly
    }
}, 60000); // Check every 60s

// Alias for /api/users/me
app.get('/api/me', verifyFirebaseToken, usersController.getProfile);

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ormmakurippu-backend',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});
app.get('/health', (req, res) => {
    // Basic connectivity check
    const dbStatus = db ? 'connected' : 'disconnected';
    const isLocalEnv = process.env.USE_LOCAL_DB === 'true';
    const isLocalInstance = db && db.constructor.name === 'LocalDb';

    res.status(dbStatus === 'connected' ? 200 : 503).json({
        ok: dbStatus === 'connected',
        dbProvider: (isLocalEnv || isLocalInstance) ? 'LocalDb' : 'Firestore',
        dbStatus,
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// --- Auth Routes (Google OAuth) ---

app.get('/auth/google', (req, res) => {
    const oauth2Client = getOAuthClient();
    const scopes = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial for refresh tokens
        scope: scopes,
        prompt: 'consent' // Force consent to ensure we get a refresh token
    });

    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        // Prisma instance (Dynamic import to avoid top-level if not used elsewhere, or use global)
        // We can assume PrismaClient is available or import it.
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // Real Exchange Logic
        const oauth2Client = getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });
        const { data } = await oauth2.userinfo.get();
        const { id: google_uid, email, name, picture } = data;

        // Upsert User in Prisma
        let user = await prisma.user.findUnique({
            where: { google_uid },
        });

        if (!user) {
            const existingByEmail = await prisma.user.findUnique({
                where: { primary_email_id: email }
            });

            if (existingByEmail) {
                user = await prisma.user.update({
                    where: { id: existingByEmail.id },
                    data: { google_uid }
                });
            } else {
                user = await prisma.user.create({
                    data: {
                        google_uid,
                        primary_email_id: email,
                        role: 'USER',
                        emails: {
                            create: {
                                email: email,
                                is_primary: true,
                                is_verified: true
                            }
                        }
                    }
                });

                // Link pending tasks assigned to this email
                await prisma.task.updateMany({
                    where: { assigned_to_email: email },
                    data: {
                        assigned_to_user_id: user.id,
                        assigned_to_email: null
                    }
                });
                console.log(`[Auth] Linked pending tasks for new user: ${email}`);
            }
        }

        // Phase 7: Ensure default workspace
        // Dynamic import to avoid circular dependency if tailored
        const { WorkspacesService } = await import('./features/workspaces/workspaces.service.js');
        const workspaceService = new WorkspacesService();
        await workspaceService.ensureDefaultWorkspace(user.id, email);

        // JWT Session for Client (Set cookie)
        // In a real app we'd sign a JWT here. For simplicity, we are relying on ID Token verification in middleware,
        // BUT middleware expects 'Bearer <id_token>' or session cookie.
        // Since we did a backend exchange, we have 'tokens.id_token'.
        if (tokens.id_token) {
            // Secure cookie in production
            res.cookie('session', tokens.id_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 3600000 // 1 hour
            });
            // Also store refresh token if needed (securely encrypted)
        }

        // Redirect back to client
        const clientUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
        res.redirect(`${clientUrl}/app?login=success`);

    } catch (error) {
        console.error('Error exchanging code:', error);
        res.status(500).send('Authentication failed');
    }
});

// Endpoint for Frontend (React-OAuth) code exchange
if (process.env.E2E_TEST_MODE === 'true') {
    app.get('/api/auth/demo-login', (req, res) => {
        console.log('🧪 E2E_TEST_MODE: Auto-login triggered');
        // Set the session cookie that the middleware checks
        res.cookie('session', 'e2e-magic-token', {
            httpOnly: false, // Allow client JS to read if needed (though middleware checks cookie)
            path: '/',
            maxAge: 3600000
        });
        // Redirect back to client root
        res.redirect('http://localhost:3000/app');
    });
}

// Inline auth logic removed. Use /api/auth/google (AuthController) instead.

// App Routes
app.use('/admin', adminRoutes); // Mount at /admin (e.g. /admin/dashboard)
app.use('/api/account', accountRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/auth', authRoutes); // /api/auth/login, etc.
app.use('/api/activity', activityRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/linked-accounts', linkedAccountsRoutes);
app.use('/api/account-closure', accountClosureRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Error Handling Middleware (MUST be last)
import { errorHandler } from './middleware/error-handler.js';
app.use(errorHandler);

// app.listen(PORT, () => {
clusterListen(PORT);

function clusterListen(port) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}
