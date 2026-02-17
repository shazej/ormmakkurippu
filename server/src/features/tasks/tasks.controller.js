import { TasksService } from './tasks.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

export class TasksController {
    constructor() {
        this.service = new TasksService();
    }

    async getTasks(req, res) {
        try {
            const filters = {
                includeDeleted: req.query.includeDeleted === 'true'
            };
            const tasks = await this.service.getTasks(req.user, filters, req.pagination);
            sendSuccess(res, tasks);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getTask(req, res) {
        try {
            const task = await this.service.getTask(req.params.id, req.user);
            sendSuccess(res, task);
        } catch (error) {
            sendError(res, error);
        }
    }

    async createTask(req, res) {
        try {
            // 1. AUTH CHECK
            const userId = req.user && req.user.uid;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User ID not found in token."
                });
            }

            // 2. VALIDATION (Zod)
            // Ensure enum matches frontend values: ['Low', 'Medium', 'High']
            const schema = z.object({
                title: z.string().min(1, "Title is required").max(200).optional(),
                fromName: z.string().optional(),
                fromPhone: z.string().optional(),
                description: z.string().optional(),
                priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
                status: z.enum(['Pending', 'In Progress', 'Completed', 'New', 'Done']).optional(),
                category: z.string().optional(),
                notes: z.string().optional(),
                reminderAt: z.string().datetime().nullable().optional()
            });

            // Validate Input
            const data = schema.parse(req.body);

            // Business Logic: Title Fallback
            if (!data.title) {
                if (data.fromName) {
                    data.title = data.fromName;
                } else if (data.description) {
                    data.title = data.description.substring(0, 50);
                } else {
                    data.title = "Untitled Task";
                }
            }

            // Map Legacy Status
            if (data.status === 'New') data.status = 'Pending';
            if (data.status === 'Done') data.status = 'Completed';

            console.log(`[TasksController] Creating task for user ${userId}:`, { title: data.title, priority: data.priority });

            // 3. DATABASE ACTION
            try {
                const task = await this.service.createTask(req.user, data);
                // 4. SUCCESS RESPONSE
                sendSuccess(res, task, 'Task created successfully', 201);
            } catch (dbError) {
                console.error("[TasksController] Database error:", dbError);
                // Return 500 for DB errors
                return res.status(500).json({
                    success: false,
                    message: "Database error while creating task.",
                    error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                });
            }

        } catch (error) {
            // Validation or other errors handled by sendError
            sendError(res, error);
        }
    }

    async updateTask(req, res) {
        try {
            const schema = z.object({
                title: z.string().min(1).max(200).optional(),
                description: z.string().optional(),
                priority: z.enum(['Low', 'Medium', 'High']).optional(),
                status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
                category: z.string().optional(),
                reminderAt: z.string().datetime().nullable().optional(), // ISO 8601
                notes: z.string().optional()
            });
            const data = schema.parse(req.body);

            const task = await this.service.updateTask(req.params.id, req.user, data);
            sendSuccess(res, task, 'Task updated successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async deleteTask(req, res) {
        try {
            await this.service.deleteTask(req.params.id, req.user);
            sendSuccess(res, null, 'Task deleted successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async shareTask(req, res) {
        try {
            await this.service.shareTask(req.params.id, req.user);
            // Re-fetch to get the token
            const task = await this.service.getTask(req.params.id, req.user);

            // Construct full URL (demonstration purpose)
            const shareUrl = `${req.protocol}://${req.get('host')}/api/shared/${task.shareToken}`;

            sendSuccess(res, { shareToken: task.shareToken, shareUrl }, 'Task shared successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async getSharedTask(req, res) {
        try {
            const task = await this.service.getSharedTask(req.params.token);
            // Return public view of task (maybe restricted fields?)
            // For now, return full task
            sendSuccess(res, task);
        } catch (error) {
            sendError(res, error);
        }
    }
}
