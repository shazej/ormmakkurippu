import { AccountClosureRepository } from './account-closure.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logAudit } from '../../admin/audit.js';
import argon2 from 'argon2';
import crypto from 'crypto';

const repo = new AccountClosureRepository();
const usersRepo = new UsersRepository();

export class AccountClosureService {

    async requestClosure(user) {
        // 1. Check if already pending
        const pending = await repo.findPendingByUserId(user.uid);
        if (pending.length > 0) {
            return { message: 'Closure request already pending', requestId: pending[0].id };
        }

        // 2. Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // 3. Create Request
        const request = await repo.create({
            user_id: user.uid,
            confirmation_token_hash: tokenHash,
            requested_at: new Date().toISOString(),
            status: 'pending'
        });

        await logAudit(user, 'REQUEST_ACCOUNT_CLOSURE', 'closure_request', request.id, {});

        // In real app: Send Email with Token
        return {
            message: 'Closure confirmation email sent',
            // For Demo/Dev: return token
            confirmation_token: token
        };
    }

    async confirmClosure(user, { token, password }) {
        // 1. Validate Password
        const userProfile = await usersRepo.findById(user.uid);
        if (userProfile.password_hash) {
            if (!password) throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Password required');
            const valid = await argon2.verify(userProfile.password_hash, password);
            if (!valid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Invalid password');
        }

        // 2. Validate Token
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const request = await repo.findByTokenHash(tokenHash);

        if (!request || request.user_id !== user.uid || request.status !== 'pending') {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid or expired closure token');
        }

        // 3. Mark Confirmed
        await repo.update(request.id, {
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
        });

        // 4. Trigger Async Job (Stub)
        // In real app, this would be a queue. Here we just do the "Soft Lock" part.
        await usersRepo.update(user.uid, {
            deletedAt: new Date().toISOString(), // Soft delete user
            status: 'closed'
        });

        await logAudit(user, 'CONFIRM_ACCOUNT_CLOSURE', 'user', user.uid, {});

        return { success: true, message: 'Account closed successfully. You will be logged out.' };
    }

    async cancelClosure(user) {
        const pending = await repo.findPendingByUserId(user.uid);
        if (pending.length === 0) {
            throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'No pending closure request found');
        }

        for (const req of pending) {
            await repo.update(req.id, { status: 'cancelled' });
        }

        await logAudit(user, 'CANCEL_ACCOUNT_CLOSURE', 'user', user.uid, {});
        return { success: true };
    }
}
