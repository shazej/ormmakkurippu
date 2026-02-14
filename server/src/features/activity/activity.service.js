import { BaseRepository } from '../../core/base-repository.js';
import { AppError } from '../../utils/errors.js';

// We reuse Audit Logs for Activity.
// But we might want a specialized read-only view.
// In Firebase/LocalDb, we can just query the 'audit_logs' collection.

export class ActivityService {
    constructor() {
        this.auditRepo = new BaseRepository('audit_logs');
        this.appSigninsRepo = new BaseRepository('app_signins'); // New collection for app usage
    }

    async listActivity(user, filters = {}, limit = 50) {
        // Enforce user_id filter
        const queryFilters = [
            { field: 'actorUid', op: '==', value: user.uid },
            ...Object.entries(filters).map(([key, value]) => ({ field: key, op: '==', value }))
        ];

        // This is a rough mapping. Real audit logs might need better indexing.
        return this.auditRepo.find(queryFilters, limit, { field: 'timestamp', dir: 'desc' });
    }

    async listAppSignins(user) {
        return this.appSigninsRepo.find([
            { field: 'user_id', op: '==', value: user.uid }
        ], 50, { field: 'last_used_at', dir: 'desc' });
    }
}
