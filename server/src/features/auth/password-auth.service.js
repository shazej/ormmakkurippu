/**
 * Email + password authentication service.
 * Completely standalone from Google / Firebase auth.
 * Uses argon2 for hashing and a custom JWT for sessions.
 */
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../../utils/jwt.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';

const prisma = new PrismaClient();
const workspacesService = new WorkspacesService();

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Validate password strength: min 8 chars, at least 1 letter + 1 digit */
function validatePassword(password) {
    if (!password || password.length < 8) {
        throw Object.assign(new Error('Password must be at least 8 characters.'), { statusCode: 400, isOperational: true });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        throw Object.assign(new Error('Password must contain at least one letter and one number.'), { statusCode: 400, isOperational: true });
    }
}

/** Build a safe, serialisable user object to return to the frontend */
function serializeUser(user, primaryEmail) {
    return {
        id:               user.id,
        display_name:     user.display_name,
        email:            primaryEmail || user.primary_email_id,
        avatar_url:       user.avatar_url,
        role:             user.role,
        use_case:         user.use_case,
        is_onboarded:     user.is_onboarded,
        onboarding_step:  user.onboarding_step,
        default_workspace_id: user.default_workspace_id,
    };
}

// ─── service ─────────────────────────────────────────────────────────────────

export class PasswordAuthService {

    /** Create a new user account with email + password */
    async signup({ name, email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check existing
        const existing = await prisma.user.findUnique({
            where: { primary_email_id: normalizedEmail }
        });
        if (existing) {
            throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 409, isOperational: true });
        }

        // 2. Validate
        validatePassword(password);

        // 3. Hash
        const password_hash = await argon2.hash(password, { type: argon2.argon2id });

        // 4. Create user + primary email in a transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    display_name:     name?.trim() || normalizedEmail.split('@')[0],
                    primary_email_id: normalizedEmail,
                    password_hash,
                    role:             'USER',
                    preferences:      {},
                    emails: {
                        create: {
                            email:       normalizedEmail,
                            is_primary:  true,
                            is_verified: false,   // Real flow would send verification email
                        }
                    }
                }
            });

            // Activate any pending task assignments
            await tx.task.updateMany({
                where: { assigned_to_email: normalizedEmail },
                data:  { assigned_to_user_id: newUser.id, assigned_to_email: null }
            });

            return newUser;
        });

        // 5. Ensure default workspace
        await workspacesService.ensureDefaultWorkspace(user.id, normalizedEmail);
        await workspacesService.acceptPendingInvites({ id: user.id }, normalizedEmail);

        // 6. Issue token
        const token = signToken({ uid: user.id, email: normalizedEmail, type: 'password' });

        return { user: serializeUser(user, normalizedEmail), token };
    }

    /** Authenticate an existing user with email + password */
    async login({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { primary_email_id: normalizedEmail }
        });

        if (!user) {
            throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401, isOperational: true });
        }

        // 2. Check password
        if (!user.password_hash) {
            throw Object.assign(new Error('This account uses Google login. Please sign in with Google.'), { statusCode: 400, isOperational: true });
        }

        const valid = await argon2.verify(user.password_hash, password);
        if (!valid) {
            throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401, isOperational: true });
        }

        // 3. Ensure workspace / pending invites (same as Google login flow)
        await workspacesService.ensureDefaultWorkspace(user.id, normalizedEmail);
        await workspacesService.acceptPendingInvites({ id: user.id }, normalizedEmail);

        // 4. Issue token
        const token = signToken({ uid: user.id, email: normalizedEmail, type: 'password' });

        return { user: serializeUser(user, normalizedEmail), token };
    }
}
