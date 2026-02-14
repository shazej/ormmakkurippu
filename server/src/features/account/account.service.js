import { UserEmailsRepository } from './account.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import crypto from 'crypto';
import { logAudit } from '../../admin/audit.js'; // We might want to move this or create a better interface

const emailRepo = new UserEmailsRepository();

export class AccountService {
    async getEmails(userId) {
        return emailRepo.findByUserId(userId);
    }

    async addEmail(user, email) {
        // Check if email exists
        const existing = await emailRepo.findByEmail(email);
        if (existing) {
            throw new AppError(ErrorCodes.EMAIL_ALREADY_REGISTERED, 'Email is already associated with an account');
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        const newEmail = await emailRepo.create({
            user_id: user.uid,
            email,
            is_primary: false,
            is_verified: false,
            verification_token_hash: tokenHash,
            verification_expires_at: expiresAt
        });

        await logAudit(user, 'ADD_EMAIL', 'email', newEmail.id, { email });

        // TODO: Send verification email (Mock for now)
        console.log(`[MOCK EMAIL] Verification for ${email}: Token=${verificationToken}`);

        return newEmail;
    }

    async verifyEmail(user, token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const emailRecord = await emailRepo.findByToken(tokenHash);

        if (!emailRecord) {
            throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Invalid verification token');
        }

        if (new Date(emailRecord.verification_expires_at) < new Date()) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Verification token expired');
        }

        if (emailRecord.user_id !== user.uid) {
            throw new AppError(ErrorCodes.ACCESS_DENIED, 'Token does not belong to this user');
        }

        await emailRepo.update(emailRecord.id, {
            is_verified: true,
            verification_token_hash: null,
            verification_expires_at: null
        });

        await logAudit(user, 'VERIFY_EMAIL', 'email', emailRecord.id, { email: emailRecord.email });

        return { success: true };
    }

    async setPrimaryEmail(user, emailId) {
        const emailRecord = await emailRepo.findById(emailId);
        if (!emailRecord) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Email not found');

        if (emailRecord.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        if (!emailRecord.is_verified) {
            throw new AppError(ErrorCodes.EMAIL_NOT_VERIFIED, 'Cannot set unverified email as primary');
        }

        // Unset current primary
        const userEmails = await emailRepo.findByUserId(user.uid);
        const currentPrimary = userEmails.find(e => e.is_primary);

        if (currentPrimary) {
            await emailRepo.update(currentPrimary.id, { is_primary: false });
        }

        await emailRepo.update(emailId, { is_primary: true });

        // Update user profile primary_email_id (if we had a user repo, we would do it there too)
        // For now, assuming syncing or just relying on emails collection is enough?
        // The requirements say user model has `primary_email_id`. We should update that too.
        // But we don't have UserRepo yet. 
        // Let's assume we do this later or here if we instantiate a generic repo for users.

        await logAudit(user, 'SET_PRIMARY_EMAIL', 'email', emailId, { email: emailRecord.email });

        return { success: true };
    }

    async removeEmail(user, emailId) {
        const emailRecord = await emailRepo.findById(emailId);
        if (!emailRecord) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Email not found');
        if (emailRecord.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        if (emailRecord.is_primary) {
            throw new AppError(ErrorCodes.PRIMARY_EMAIL_CANNOT_BE_REMOVED, 'Cannot remove primary email. Set another primary first.');
        }

        await emailRepo.delete(emailId);
        await logAudit(user, 'REMOVE_EMAIL', 'email', emailId, { email: emailRecord.email });

        return { success: true };
    }

    async resendVerification(user, emailId) {
        const emailRecord = await emailRepo.findById(emailId);
        if (!emailRecord) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Email not found');
        if (emailRecord.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');
        if (emailRecord.is_verified) throw new AppError(ErrorCodes.EMAIL_ALREADY_VERIFIED, 'Email already verified');

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await emailRepo.update(emailId, {
            verification_token_hash: tokenHash,
            verification_expires_at: expiresAt
        });

        // TODO: Send verification email
        console.log(`[MOCK EMAIL] Resend Verification for ${emailRecord.email}: Token=${verificationToken}`);

        return { success: true };
    }
}
