import { LinkedAccountsRepository } from './linked-accounts.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logAudit } from '../../admin/audit.js';

const repo = new LinkedAccountsRepository();
const usersRepo = new UsersRepository();

export class LinkedAccountsService {

    async listLinkedAccounts(user) {
        return repo.findByUserId(user.uid);
    }

    async linkAccount(user, provider, authData) {
        // 1. Verify authData with provider (Mock for now)
        // In real app: exchange code/token for profile

        const mockProfile = {
            id: `mock-${provider}-${Date.now()}`,
            email: `user-at-${provider}@example.com`
        };

        // 2. Check if already linked to THIS user (Prevent duplicates for same provider)
        const existing = await repo.findByUserId(user.uid);
        if (existing.find(a => a.provider === provider)) {
            throw new AppError(ErrorCodes.RESOURCE_ALREADY_EXISTS, `You have already linked a ${provider} account.`);
        }

        // 3. Check if linked to ANOTHER user (Conflict)
        const others = await repo.findByProvider(provider, mockProfile.id);
        if (others.length > 0) {
            throw new AppError(ErrorCodes.RESOURCE_ALREADY_EXISTS, 'Account linked to another user');
        }

        // 4. Create link
        const link = await repo.create({
            user_id: user.uid,
            provider,
            provider_user_id: mockProfile.id,
            email: mockProfile.email,
            linked_at: new Date().toISOString(),
            last_used_at: null
        });

        await logAudit(user, 'LINK_ACCOUNT', 'linked_account', link.id, { provider });
        return link;
    }

    async unlinkAccount(user, id) {
        const account = await repo.findById(id);
        if (!account) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Linked account not found');
        if (account.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        // Rule: Cannot unlink last remaining login method?
        // We need to check if user has password OR other linked accounts.

        const allLinks = await repo.findByUserId(user.uid);
        if (allLinks.length <= 1) {
            // Check if user has password
            const userProfile = await usersRepo.findById(user.uid);
            if (!userProfile || !userProfile.password_hash) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot unlink last login method (no password set)');
            }
        }

        await repo.delete(id);
        await logAudit(user, 'UNLINK_ACCOUNT', 'linked_account', id, { provider: account.provider });
        return { success: true };
    }
}
