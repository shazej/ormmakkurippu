import { BaseRepository } from '../../core/base-repository.js';

export class NotificationSettingsRepository extends BaseRepository {
    constructor() {
        super('notification_settings');
    }

    async findByUserId(userId) {
        return this.findOne('user_id', userId);
    }

    async upsert(userId, data) {
        const existing = await this.findByUserId(userId);
        if (existing) {
            return this.update(existing.id, data);
        } else {
            return this.create({ user_id: userId, ...data });
        }
    }
}

export class OAuthConsentsRepository extends BaseRepository {
    constructor() {
        super('oauth_consents');
    }

    async findByUserId(userId) {
        return this.find([{ field: 'user_id', op: '==', value: userId }]);
    }
}
