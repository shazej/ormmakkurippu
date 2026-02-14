import { BaseRepository } from '../../core/base-repository.js';

export class UserEmailsRepository extends BaseRepository {
    constructor() {
        super('user_emails');
    }

    async findByEmail(email) {
        return this.findOne('email', email);
    }

    async findByUserId(userId) {
        return this.find([{ field: 'user_id', op: '==', value: userId }]);
    }

    async findByToken(token) {
        // Since we store hash, service needs to pass hash here.
        // Actually, for simplicity in MVP, we might just store the token or hash.
        // The requirement said "verification_token_hash".
        return this.findOne('verification_token_hash', token);
    }
}
