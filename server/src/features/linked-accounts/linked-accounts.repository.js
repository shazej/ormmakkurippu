import { BaseRepository } from '../../core/base-repository.js';

export class LinkedAccountsRepository extends BaseRepository {
    constructor() {
        super('linked_accounts');
    }

    async findByUserId(userId) {
        const results = await this.find([{ field: 'user_id', op: '==', value: userId }]);
        return results.filter(r => !r.deletedAt);
    }

    async findByProvider(provider, providerUserId) {
        // Compound query might need index in Firestore
        // For LocalDb it works fine.
        return this.find([
            { field: 'provider', op: '==', value: provider },
            { field: 'provider_user_id', op: '==', value: providerUserId }
        ]);
        // Note: BaseRepository.find returns array. We might want findOne logic here.
    }
}
