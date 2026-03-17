/**
 * TaskSharingController
 *
 * Handles the single public endpoint: GET /api/shared/tasks/:token
 * No authentication middleware is applied to these routes.
 */

import { TaskSharingService } from './task-sharing.service.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export class TaskSharingController {
    constructor() {
        this.service = new TaskSharingService();
    }

    getSharedTask = async (req, res) => {
        try {
            const { token } = req.params;

            // Basic token format guard — base64url tokens are 43 chars.
            // Malformed tokens are rejected before hitting the DB.
            if (!token || token.length < 20 || token.length > 100) {
                return sendError(res, new AppError('Invalid share link', 400));
            }

            const task = await this.service.getTaskByToken(token);
            sendSuccess(res, task);
        } catch (error) {
            // sendError expects an Error-like object with .statusCode.
            // AppError from the service already carries the right status code.
            sendError(res, error);
        }
    };
}
