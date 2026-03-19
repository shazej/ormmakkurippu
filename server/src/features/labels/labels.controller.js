import { LabelsService } from './labels.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

export class LabelsController {
    constructor() {
        this.service = new LabelsService();
    }

    getLabels = async (req, res) => {
        try {
            const search = req.query.search || '';
            const labels = await this.service.getLabels(req.user, search);
            sendSuccess(res, labels);
        } catch (error) {
            sendError(res, error);
        }
    };

    createLabel = async (req, res) => {
        try {
            const schema = z.object({
                name: z.string().min(1).max(50),
                color: z.string().regex(/^#[0-9a-fA-F]{3,6}$/).optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: result.error.errors
                });
            }

            const label = await this.service.createLabel(req.user, result.data);
            sendSuccess(res, label, 'Label created', 201);
        } catch (error) {
            sendError(res, error);
        }
    };
}
