import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { UsersRepository } from '../features/users/users.repository.js';
import { WorkspacesService } from '../features/workspaces/workspaces.service.js';

const prisma = new PrismaClient();
const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
const usersRepo = new UsersRepository();
const workspacesService = new WorkspacesService();

/**
 * Middleware to verify Google ID Tokens.
 * Replaces the previous Firebase Auth middleware but keeps the name for compatibility.
 */
export const verifyFirebaseToken = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        console.log('[DEBUG] E2E_TEST_MODE:', process.env.E2E_TEST_MODE);

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

            // Upsert Test User to satisfy Foreign Keys
            let user = await prisma.user.findUnique({ where: { id: uid } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        id: uid,
                        google_uid: uid, // Use same for simplicity
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
                console.log(`[Auth E2E] Created test user: ${email}`);
            }

            // Always try to link pending tasks in E2E mode (since we might recreate tasks but reuse user)
            const updateResult = await prisma.task.updateMany({
                where: { assigned_to_email: email },
                data: {
                    assigned_to_user_id: user.id,
                    assigned_to_email: null
                }
            });
            console.log(`[Auth E2E] Linked ${updateResult.count} tasks for ${email}`);

            // Phase 7: Ensure default workspace (E2E)
            const { WorkspacesService } = await import('../features/workspaces/workspaces.service.js');
            const workspaceService = new WorkspacesService();
            await workspaceService.ensureDefaultWorkspace(uid, email);
            await workspaceService.acceptPendingInvites(user, email);

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

        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub: google_uid, email, name, picture } = payload;



        // 2. Find or Create User via Repository
        const user = await usersRepo.createOrUpdateGoogleUser({
            google_uid,
            email,
            name,
            picture,
            email_verified: payload.email_verified
        });

        // Ensure default workspace (Phase 7 requirement)
        await workspacesService.ensureDefaultWorkspace(user.id, email);

        // Auto-accept pending invites (Phase 8 requirement)
        await workspacesService.acceptPendingInvites(user, email);

        // 3. Attach to Request
        req.user = {
            uid: user.id, // Internal ID (UUID)
            google_uid: user.google_uid,
            email: user.primary_email_id,
            role: user.role,
            name: name,
            picture: picture,
            // Pass full user object if needed for policies
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
