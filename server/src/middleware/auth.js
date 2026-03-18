import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { UsersRepository } from '../features/users/users.repository.js';
import { WorkspacesService } from '../features/workspaces/workspaces.service.js';

const prisma = new PrismaClient();
const googleClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
const usersRepo = new UsersRepository();
const workspacesService = new WorkspacesService();

/**
 * Middleware to verify both Google ID Tokens and our custom JWTs.
 * Google ID tokens are used by Google OAuth users.
 * Custom JWTs (signed with JWT_SECRET) are used by email/password users.
 */
export const verifyFirebaseToken = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.session) {
            token = req.cookies.session;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: No token provided'
            });
        }

        // E2E Bypass for testing
        if (process.env.E2E_TEST_MODE === 'true' && token.startsWith('e2e-magic-token')) {
            const isUser2 = token === 'e2e-magic-token-2';
            const uid = isUser2 ? 'test-e2e-user-2' : 'test-e2e-user';
            const email = isUser2 ? 'colleague@example.com' : 'test@example.com';

            let user = await prisma.user.findUnique({ where: { id: uid } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        id: uid,
                        google_uid: uid,
                        primary_email_id: email,
                        role: 'USER',
                        emails: {
                            create: { email, is_primary: true, is_verified: true }
                        }
                    }
                });
                console.log(`[Auth E2E] Created test user: ${email}`);
            }

            await prisma.task.updateMany({
                where: { assigned_to_email: email },
                data: { assigned_to_user_id: user.id, assigned_to_email: null }
            });

            const { WorkspacesService: WS } = await import('../features/workspaces/workspaces.service.js');
            const ws = new WS();
            await ws.ensureDefaultWorkspace(uid, email);
            await ws.acceptPendingInvites(user, email);

            req.user = {
                uid: user.id,
                google_uid: user.google_uid,
                email: user.primary_email_id,
                role: user.role,
                name: isUser2 ? 'Colleague User' : 'Test User',
                _dbUser: user
            };
            return next();
        }

        // Try custom JWT first (password-based users)
        if (process.env.JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.type === 'password') {
                    // Fetch user from DB
                    const user = await prisma.user.findUnique({
                        where: { id: decoded.uid },
                        include: { allowed_ips: true, geofence: true }
                    });

                    if (!user) {
                        return res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
                    }

                    req.user = {
                        uid: user.id,
                        google_uid: user.google_uid,
                        email: user.primary_email_id,
                        role: user.role,
                        name: user.display_name,
                        picture: user.avatar_url,
                        _dbUser: user
                    };
                    return next();
                }
            } catch (jwtErr) {
                // Not a valid JWT, try as Google token below
                if (jwtErr.name !== 'JsonWebTokenError' && jwtErr.name !== 'NotBeforeError') {
                    if (jwtErr.name === 'TokenExpiredError') {
                        return res.status(401).json({ success: false, error: 'Unauthorized: Session expired' });
                    }
                }
            }
        }

        // Try Google ID Token verification
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: google_uid, email, name, picture } = payload;

        const user = await usersRepo.createOrUpdateGoogleUser({
            google_uid,
            email,
            name,
            picture,
            email_verified: payload.email_verified
        });

        await workspacesService.ensureDefaultWorkspace(user.id, email);
        await workspacesService.acceptPendingInvites(user, email);

        req.user = {
            uid: user.id,
            google_uid: user.google_uid,
            email: user.primary_email_id,
            role: user.role,
            name,
            picture,
            _dbUser: user
        };

        next();
    } catch (error) {
        console.error('Auth Verification Error:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid token'
        });
    }
};
