import { ActivityRepository } from './activity.repository.js';
import { AppError } from '../../utils/app-error.js';

export class ActivityService {
    constructor() {
        this.repository = new ActivityRepository();
    }

    async listActivity(user, filters = {}, limit = 50) {
        // Enforce querying only the user's own activity
        const queryFilters = [
            { field: 'actorUid', op: '==', value: user.uid }
        ];

        // Add other allowed filters (e.g., targetType)
        if (filters.targetType) {
            queryFilters.push({ field: 'targetType', op: '==', value: filters.targetType });
        }
        if (filters.action) {
            queryFilters.push({ field: 'action', op: '==', value: filters.action });
        }

        return await this.repository.find(queryFilters, parseInt(limit) || 50);
    }

    async createLog(data) {
        return await this.repository.create(data);
    }
}

