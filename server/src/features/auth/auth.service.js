import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/app-error.js';
import { logAudit } from '../../admin/audit.js';
import { google } from 'googleapis';
import { getOAuthClient } from '../../drive.js';
import { UsersRepository } from '../users/users.repository.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';

const prisma = new PrismaClient();
const usersRepo = new UsersRepository();
const workspacesService = new WorkspacesService();

// Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
const PASSWORD_MIN_LENGTH = 8;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const JWT_EXPIRY = '7d';

function validatePasswordStrength(password) {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
        throw new AppError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`, 400, 'PASSWORD_TOO_WEAK');
    }
    if (!/[A-Z]/.test(password)) {
        throw new AppError('Password must contain at least one uppercase letter.', 400, 'PASSWORD_TOO_WEAK');
    }
    if (!/[a-z]/.test(password)) {
        throw new AppError('Password must contain at least one lowercase letter.', 400, 'PASSWORD_TOO_WEAK');
    }
    if (!/[0-9]/.test(password)) {
        throw new AppError('Password must contain at least one number.', 400, 'PASSWORD_TOO_WEAK');
    }
}

function issueJwt(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('JWT_SECRET is not configured.', 500, 'INTERNAL_ERROR');
    return jwt.sign(
        { uid: user.id, email: user.primary_email_id, type: 'password' },
        secret,
        { expiresIn: JWT_EXPIRY }
    );
}

function deriveProvider(user) {
    if (user.google_uid && user.password_hash) return 'BOTH';
    if (user.google_uid) return 'GOOGLE';
    return 'PASSWORD';
}

export class AuthService {
    async signup({ name, email, password, confirmPassword }) {
        if (!name || !email || !password || !confirmPassword) {
            throw new AppError('All fields are required.', 400, 'VALIDATION_ERROR');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError('Invalid email address.', 400, 'VALIDATION_ERROR');
        }

        if (password !== confirmPassword) {
            throw new AppError('Passwords do not match.', 400, 'VALIDATION_ERROR');
        }

        validatePasswordStrength(password);

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { primary_email_id: normalizedEmail }
        });

        if (existingUser) {
            const provider = deriveProvider(existingUser);
            if (provider === 'GOOGLE') {
                throw new AppError(
                    'This email is registered via Google. Please sign in with Google.',
                    409,
                    'PROVIDER_MISMATCH_GOOGLE_ONLY'
                );
            }
            throw new AppError('An account with this email already exists.', 409, 'EMAIL_ALREADY_REGISTERED');
        }

        const password_hash = await argon2.hash(password);

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    primary_email_id: normalizedEmail,
                    display_name: name.trim(),
                    password_hash,
                    role: 'USER',
                    preferences: {},
                    emails: {
                        create: {
                            email: normalizedEmail,
                            is_primary: true,
                            is_verified: false
                        }
                    }
                }
            });

            // Link pending task assignments
            await tx.task.updateMany({
                where: { assigned_to_email: normalizedEmail, assigned_to_user_id: null },
                data: { assigned_to_user_id: newUser.id, assigned_to_email: null }
            });

            // Activate pending workspace invites
            await tx.workspaceMember.updateMany({
                where: { email: normalizedEmail, status: 'PENDING' },
                data: { status: 'ACTIVE', user_id: newUser.id, joined_at: new Date() }
            });

            return newUser;
        });

        await workspacesService.ensureDefaultWorkspace(user.id, normalizedEmail);
        await logAudit({ uid: user.id, email: normalizedEmail, role: user.role }, 'USER_SIGNUP', 'user', user.id, { method: 'password' });

        const token = issueJwt(user);
        return { user, token };
    }

    async loginWithPassword({ email, password }) {
        if (!email || !password) {
            throw new AppError('Email and password are required.', 400, 'VALIDATION_ERROR');
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { primary_email_id: normalizedEmail },
            include: { allowed_ips: true, geofence: true }
        });

        if (!user) {
            // Avoid leaking user existence — generic message
            throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        const provider = deriveProvider(user);

        if (provider === 'GOOGLE') {
            throw new AppError(
                'This account uses Google Sign-In. Please continue with Google.',
                403,
                'PROVIDER_MISMATCH_GOOGLE_ONLY'
            );
        }

        if (!user.password_hash) {
            throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        const isValid = await argon2.verify(user.password_hash, password);
        if (!isValid) {
            throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        await logAudit({ uid: user.id, email: normalizedEmail, role: user.role }, 'USER_LOGIN', 'user', user.id, { method: 'password' });

        const token = issueJwt(user);
        return { user, token };
    }

    async logout(userId) {
        // For JWT-based auth, token invalidation is client-side (clear storage/cookie).
        // Optionally record logout in audit log.
        if (userId) {
            try {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    await logAudit({ uid: userId, email: user.primary_email_id, role: user.role }, 'USER_LOGOUT', 'user', userId, {});
                }
            } catch (_) { /* non-critical */ }
        }
        return { message: 'Logged out successfully.' };
    }

    async forgotPassword(email) {
        if (!email) throw new AppError('Email is required.', 400, 'VALIDATION_ERROR');

        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw new AppError('Invalid email address.', 400, 'VALIDATION_ERROR');
        }

        const user = await prisma.user.findUnique({ where: { primary_email_id: normalizedEmail } });

        // Always return success to prevent email enumeration
        if (!user) {
            return { message: 'If that email exists, a reset link has been sent.' };
        }

        const provider = deriveProvider(user);
        if (provider === 'GOOGLE') {
            // Return success but with a hint — the email will contain guidance
            // In a real email we'd tell them to use Google. Here we just return success.
            return { message: 'If that email exists, a reset link has been sent.' };
        }

        // Generate secure reset token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_reset_token_hash: tokenHash,
                password_reset_expires_at: expiresAt
            }
        });

        const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
        const resetLink = `${clientOrigin}/reset-password?token=${rawToken}`;

        // In production: send via email provider (SendGrid, AWS SES, etc.)
        console.log(`[Auth] Password reset link for ${normalizedEmail}: ${resetLink}`);

        return { message: 'If that email exists, a reset link has been sent.' };
    }

    async resetPassword({ token, newPassword, confirmPassword }) {
        if (!token || !newPassword || !confirmPassword) {
            throw new AppError('Token and new password are required.', 400, 'VALIDATION_ERROR');
        }

        if (newPassword !== confirmPassword) {
            throw new AppError('Passwords do not match.', 400, 'VALIDATION_ERROR');
        }

        validatePasswordStrength(newPassword);

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                password_reset_token_hash: tokenHash,
                password_reset_expires_at: { gt: new Date() }
            }
        });

        if (!user) {
            throw new AppError('Invalid or expired reset token.', 400, 'INVALID_RESET_TOKEN');
        }

        const password_hash = await argon2.hash(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash,
                password_reset_token_hash: null,
                password_reset_expires_at: null,
                password_updated_at: new Date()
            }
        });

        await logAudit({ uid: user.id, email: user.primary_email_id, role: user.role }, 'PASSWORD_RESET', 'user', user.id, {});

        return { message: 'Password reset successfully. You can now sign in.' };
    }

    async checkProvider(email) {
        if (!email) throw new AppError('Email is required.', 400, 'VALIDATION_ERROR');
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { primary_email_id: normalizedEmail }
        });

        if (!user) {
            return { exists: false, provider: null };
        }

        return { exists: true, provider: deriveProvider(user) };
    }

    async loginWithGoogle(code) {
        try {
            const oauth2Client = getOAuthClient();
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
            const { data } = await oauth2.userinfo.get();
            const { id: google_uid, email, name, picture, verified_email } = data;

            const { user, activatedInvites, activatedTasks } = await prisma.$transaction(async (tx) => {
                const user = await usersRepo.createOrUpdateGoogleUser({
                    google_uid, email, name, picture, email_verified: verified_email
                }, tx);

                const pendingInvites = await tx.workspaceMember.findMany({
                    where: { email, status: 'PENDING' }
                });

                if (pendingInvites.length > 0) {
                    await tx.workspaceMember.updateMany({
                        where: { email, status: 'PENDING' },
                        data: { status: 'ACTIVE', user_id: user.id, joined_at: new Date() }
                    });
                }

                const pendingTasks = await tx.task.findMany({
                    where: { assigned_to_email: email, assigned_to_user_id: null, deleted_at: null }
                });

                if (pendingTasks.length > 0) {
                    await tx.task.updateMany({
                        where: { assigned_to_email: email, assigned_to_user_id: null, deleted_at: null },
                        data: { assigned_to_user_id: user.id, assigned_to_email: null }
                    });
                }

                return { user, activatedInvites: pendingInvites, activatedTasks: pendingTasks };
            });

            if (activatedInvites.length > 0) {
                for (const invite of activatedInvites) {
                    await logAudit(
                        { uid: user.id, email: user.primary_email_id, role: user.role },
                        'WORKSPACE_INVITE_ACCEPTED', 'workspace', invite.workspace_id, { memberId: invite.id }
                    );
                }
            }

            if (activatedTasks && activatedTasks.length > 0) {
                for (const task of activatedTasks) {
                    await logAudit(
                        { uid: user.id, email: user.primary_email_id, role: user.role },
                        'TASK_ASSIGNMENT_ACTIVATED', 'task', task.id, { previousEmail: email }
                    );
                }
            }

            await workspacesService.ensureDefaultWorkspace(user.id, email);

            return { user, tokens };
        } catch (error) {
            console.error('Google Login Error:', error);
            throw new AppError('Google Authentication Failed', 400, 'AUTH_GOOGLE_FAILED');
        }
    }

    async deactivateAccount(uid) {
        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (!user) throw new AppError('User not found.', 404, 'RESOURCE_NOT_FOUND');

        await logAudit({ uid, email: user.primary_email_id, role: user.role }, 'ACCOUNT_DEACTIVATION', 'user', uid, { reason: 'User requested deactivation' });

        // Soft-delete or flag — for now we just record the audit
        return { message: 'Account deactivation requested.' };
    }
}
