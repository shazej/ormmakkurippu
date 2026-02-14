import { BaseRepository } from '../../core/base-repository.js';

export class AccountClosureRepository extends BaseRepository {
    constructor() {
        super('account_closure_requests');
    }

    async findPendingByUserId(userId) {
        return this.find([
            { field: 'user_id', op: '==', value: userId },
            { field: 'status', op: '==', value: 'pending' }
        ]);
        // Ideally should be findOne, but for safety in case of duplicates we return list or first.
    }

    async findByTokenHash(tokenHash) {
        return this.findOne('confirmation_token_hash', tokenHash);
    }
}
