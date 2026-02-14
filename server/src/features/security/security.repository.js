import { BaseRepository } from '../../core/base-repository.js';

export class SessionsRepository extends BaseRepository {
    constructor() {
        super('sessions');
    }

    async findByUserId(userId) {
        return this.find([{ field: 'user_id', op: '==', value: userId }], 100, { field: 'last_seen_at', dir: 'desc' });
    }

    async revokeAllForUser(userId, exceptSessionId = null) {
        const sessions = await this.findByUserId(userId);
        const batchPromises = sessions
            .filter(s => !s.revoked_at && s.id !== exceptSessionId)
            .map(s => this.revoke(s.id));
        await Promise.all(batchPromises);
    }

    async revoke(id) {
        return this.update(id, { revoked_at: new Date().toISOString() });
    }
}

export class AllowedIpsRepository extends BaseRepository {
    constructor() {
        super('allowed_ips');
    }

    async findByUserId(userId) {
        // Exclude soft-deleted records
        const records = await this.find([{ field: 'user_id', op: '==', value: userId }]);
        return records.filter(r => !r.deletedAt);
    }
}

export class GeofenceRepository extends BaseRepository {
    constructor() {
        super('geofence');
    }

    async findByUserId(userId) {
        // Geofence is 1:1 per user usually, or we can use ID=userId
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

export class AppPasswordsRepository extends BaseRepository {
    constructor() {
        super('app_passwords');
    }

    async findByUserId(userId) {
        return this.find([{ field: 'user_id', op: '==', value: userId }]);
    }
}
