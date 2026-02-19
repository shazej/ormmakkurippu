import { auth, db } from '../../firebase.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { AppError } from '../../utils/app-error.js';
import { logAudit } from '../../admin/audit.js';
import { google } from 'googleapis';
import { getOAuthClient } from '../../drive.js';
import { UsersRepository } from '../users/users.repository.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';

const usersRepo = new UsersRepository();
const workspacesService = new WorkspacesService();

export class AuthService {
    async resetPassword(email) {
        try {
            const link = await auth.generatePasswordResetLink(email);
            // In a real app, send this link via email provider (SendGrid, AWS SES, etc.)
            // For MVP/Demo, we return it or log it.
            console.log(`[Mock Email] Password Reset Link for ${email}: ${link}`);
            return { link, message: 'Password reset link generated (check server logs for link in dev mode)' };
        } catch (error) {
            throw new AppError(error.message, 400);
        }
    }

    async verifyEmail(email) {
        try {
            const link = await auth.generateEmailVerificationLink(email);
            console.log(`[Mock Email] Email Verification Link for ${email}: ${link}`);
            return { link, message: 'Verification link generated (check server logs for link in dev mode)' };
        } catch (error) {
            throw new AppError(error.message, 400);
        }
    }

    async deactivateAccount(uid, user) {
        try {
            // Update user status in Firestore (assuming 'users' collection exists and is authoritative)
            // If we use Firebase Auth 'disabled' state:
            await auth.updateUser(uid, { disabled: true });

            // Also update our local user record if we have one
            await db.collection('users').doc(uid).set({
                status: 'deactivated',
                deactivatedAt: new Date().toISOString()
            }, { merge: true });

            await logAudit(user, 'ACCOUNT_DEACTIVATION', 'user', uid, { reason: 'User requested deactivation' });

            return { message: 'Account deactivated successfully' };
        } catch (error) {
            throw new AppError(error.message, 500);
        }
    }

    async loginWithGoogle(code) {
        try {
            const oauth2Client = getOAuthClient();
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            const oauth2 = google.oauth2({
                auth: oauth2Client,
                version: 'v2'
            });
            const { data } = await oauth2.userinfo.get();
            const { id: google_uid, email, name, picture, verified_email } = data;

            // Create or Update User & Activate Invites (Atomic)
            const { user, activatedInvites } = await prisma.$transaction(async (tx) => {
                const user = await usersRepo.createOrUpdateGoogleUser({
                    google_uid,
                    email,
                    name,
                    picture,
                    email_verified: verified_email
                }, tx);

                // Find pending invites
                const pendingInvites = await tx.workspaceMember.findMany({
                    where: {
                        email: email,
                        status: 'PENDING'
                    }
                });

                if (pendingInvites.length > 0) {
                    await tx.workspaceMember.updateMany({
                        where: {
                            email: email,
                            status: 'PENDING'
                        },
                        data: {
                            status: 'ACTIVE',
                            user_id: user.id,
                            joined_at: new Date()
                        }
                    });
                }

                return { user, activatedInvites: pendingInvites };
            });

            // Audit Logs for Activation
            if (activatedInvites.length > 0) {
                for (const invite of activatedInvites) {
                    await logAudit(
                        { uid: user.id, email: user.primary_email_id, role: user.role },
                        'WORKSPACE_INVITE_ACCEPTED',
                        'workspace',
                        invite.workspace_id,
                        { memberId: invite.id }
                    );
                }
            }

            // Ensure Default Workspace
            await workspacesService.ensureDefaultWorkspace(user.id, email);

            return { user, tokens };
        } catch (error) {
            console.error('Google Login Error:', error);
            throw new AppError('Google Authentication Failed', 400);
        }
    }
}
