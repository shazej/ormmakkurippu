import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { UsersRepository } from '../features/users/users.repository.js';
import { WorkspacesService } from '../features/workspaces/workspaces.service.js';
import { verifyToken } from '../utils/jwt.js';

const prisma = new PrismaClient();
const usersRepo = new UsersRepository();
const workspacesService = new WorkspacesService();

// Google OAuth2 client — only initialised when Google auth is enabled
let googleClient = null;
if (process.env.ENABLE_GOOGLE_AUTH === 'true' && process.env.GOOGLE_CLIENT_ID) {
    googleClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
}

/**
 * verifyFirebaseToken — kept as the middleware name for backward compatibility.
 *
 * Verification order:
 *   1. E2E test bypass (E2E_TEST_MODE=true)
 *   2. Custom JWT (email/password login)
 *   3. Google ID token (only when ENABLE_GOOGLE_AUTH=true)
 */
export const verifyFirebaseToken = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies?.session) {
            token = req.cookies.session;
        }

        if (!token) {
            return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
        }

        // ── 1. E2E Test Bypass ────────────────────────────────────────────────
        if (process.env.E2E_TEST_MODE === 'true' && token.startsWith('e2e-magic-token')) {
            return handleE2EToken(token, req, res, next);
        }

        // ── 2. Custom JWT (email/password) ────────────────────────────────────
        try {
            const payload = verifyToken(token);
            if (payload?.type === 'password' && payload.uid) {
                const user = await prisma.user.findUnique({
                    where: { id: payload.uid },
                    include: { allowed_ips: true, geofence: true }
                });
                if (!user) {
                    return res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
                }
                req.user = {
                    uid:       user.id,
                    email:     user.primary_email_id,
                    role:      user.role,
                    name:      user.display_name,
                    picture:   user.avatar_url,
                    _dbUser:   user,
                };
                return next();
            }
        } catch (_jwtErr) {
            // Not a valid custom JWT — fall through to Google verification
        }

        // ── 3. Google ID Token ────────────────────────────────────────────────
        if (process.env.ENABLE_GOOGLE_AUTH !== 'true' || !googleClient) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: Token not recognised. Google auth is disabled.'
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: google_uid, email, name, picture } = payload;

        const user = await usersRepo.createOrUpdateGoogleUser({
            google_uid, email, name, picture, email_verified: payload.email_verified
        });

        await workspacesService.ensureDefaultWorkspace(user.id, email);
        await workspacesService.acceptPendingInvites(user, email);

        req.user = {
            uid:       user.id,
            google_uid: user.google_uid,
            email:     user.primary_email_id,
            role:      user.role,
            name,
            picture,
            _dbUser:   user,
        };
        next();

    } catch (error) {
        console.error('Auth Verification Error:', error.message);
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
};

// ─── E2E helper (unchanged logic, extracted for clarity) ────────────────────
async function handleE2EToken(token, req, res, next) {
    const isUser2 = token === 'e2e-magic-token-2';
    const uid     = isUser2 ? 'test-e2e-user-2' : 'test-e2e-user';
    const email   = isUser2 ? 'colleague@example.com' : 'test@example.com';

    let user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: uid, google_uid: uid, primary_email_id: email, role: 'USER',
                emails: { create: { email, is_primary: true, is_verified: true } }
            }
        });
    }

    await prisma.task.updateMany({
        where: { assigned_to_email: email },
        data:  { assigned_to_user_id: user.id, assigned_to_email: null }
    });

    const { WorkspacesService } = await import('../features/workspaces/workspaces.service.js');
    const ws = new WorkspacesService();
    await ws.ensureDefaultWorkspace(uid, email);
    await ws.acceptPendingInvites(user, email);

    req.user = { uid: user.id, google_uid: user.google_uid, email: user.primary_email_id, role: user.role, name: isUser2 ? 'Colleague User' : 'Test User', _dbUser: user };
    return next();
}
