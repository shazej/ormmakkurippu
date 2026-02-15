import { ActivityService } from './activity.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

const service = new ActivityService();

export class ActivityController {

    async list(req, res) {
        try {
            const { limit, type } = req.query;
            const filters = {};
            if (type) filters.action = type.toUpperCase();

            // Support targetType filtering
            if (req.query.targetType) filters.targetType = req.query.targetType;

            const result = await service.listActivity(req.user, filters, limit);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }
}

