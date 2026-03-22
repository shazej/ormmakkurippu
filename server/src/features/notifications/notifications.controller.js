import { NotificationsService } from './notifications.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

const service = new NotificationsService();

export class NotificationsController {

    getNotifications = async (req, res) => {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
            const unreadOnly = req.query.unread_only === 'true';

            const result = await service.getNotifications(req.user.uid, { page, limit, unreadOnly });
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    };

    getUnreadCount = async (req, res) => {
        try {
            const count = await service.getUnreadCount(req.user.uid);
            sendSuccess(res, { unreadCount: count });
        } catch (error) {
            sendError(res, error);
        }
    };

    markAsRead = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return sendError(res, { message: 'Notification ID required', statusCode: 400 });

            const result = await service.markAsRead(id, req.user.uid);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    };

    markAllAsRead = async (req, res) => {
        try {
            const result = await service.markAllAsRead(req.user.uid);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    };

    getPreferences = async (req, res) => {
        try {
            const prefs = await service.getPreferences(req.user.uid);
            sendSuccess(res, prefs);
        } catch (error) {
            sendError(res, error);
        }
    };

    updatePreferences = async (req, res) => {
        try {
            const schema = z.object({
                in_app_enabled: z.boolean().optional(),
                email_enabled: z.boolean().optional(),
                task_due_enabled: z.boolean().optional(),
                task_assigned_enabled: z.boolean().optional(),
                shared_task_updates_enabled: z.boolean().optional(),
                subscription_alerts_enabled: z.boolean().optional(),
                push_enabled: z.boolean().optional(),
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: result.error.errors,
                });
            }

            const prefs = await service.updatePreferences(req.user.uid, result.data);
            sendSuccess(res, prefs);
        } catch (error) {
            sendError(res, error);
        }
    };

    processReminders = async (req, res) => {
        try {
            // Only allow ADMIN role or dev environment
            if (req.user.role !== 'ADMIN' && process.env.NODE_ENV === 'production') {
                return sendError(res, { message: 'Forbidden: admin only', statusCode: 403, isOperational: true });
            }

            const { ReminderProcessor } = await import('./reminder-processor.js');
            const processor = new ReminderProcessor();
            const result = await processor.processReminders();
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    };
}
