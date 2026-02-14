import { ActivityService } from './activity.service.js';
import { errorResponse } from '../../utils/errors.js';

const service = new ActivityService();

export class ActivityController {

    async list(req, res) {
        try {
            const { limit, type } = req.query;
            const filters = {};
            if (type) filters.action = type.toUpperCase();

            const result = await service.listActivity(req.user, filters, limit ? parseInt(limit) : 50);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async listAppSignins(req, res) {
        try {
            const result = await service.listAppSignins(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }
}
