import { TasksService } from './tasks.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

export class TasksController {
    constructor() {
        this.service = new TasksService();
    }

    // Use arrow functions to auto-bind 'this'
    getTasks = async (req, res, next) => {
        try {
            const filters = {
                includeDeleted: req.query.includeDeleted === 'true',
                ...req.query
            };
            // Pagination handling if needed, usually passed via query or middleware
            const pagination = req.pagination || {};

            const tasks = await this.service.getTasks(req.user, filters, pagination);
            sendSuccess(res, tasks);
        } catch (error) {
            console.error('[TasksController] getTasks Error:', error);
            if (next) next(error);
            else sendError(res, error);
        }
    }

    getTask = async (req, res, next) => {
        try {
            const task = await this.service.getTask(req.params.id, req.user);
            if (!task) return sendError(res, 'Task not found', 404);
            sendSuccess(res, task);
        } catch (error) {
            console.error('[TasksController] getTask Error:', error);
            if (next) next(error);
            else sendError(res, error);
        }
    }

    createTask = async (req, res, next) => {
        try {
            const userId = req.user?.uid;
            if (!userId) return sendError(res, "Unauthorized", 401);

            // Validation Schema
            const schema = z.object({
                title: z.string().min(1).max(200).optional(),
                fromName: z.string().optional(),
                fromPhone: z.string().optional(),
                description: z.string().max(2000).optional(),
                priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
                status: z.enum(['Pending', 'In Progress', 'Completed', 'New', 'Done', 'deleted']).optional(),
                category: z.string().optional(),
                notes: z.string().optional(),
                reminderAt: z.string().datetime().nullable().optional(),
                dueDate: z.string().datetime().nullable().optional(),
                assignedToEmail: z.string().email().optional().or(z.literal(''))
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: result.error.errors
                });
            }

            const data = result.data;
            // Title Fallback
            if (!data.title) {
                data.title = data.fromName || (data.description ? data.description.substring(0, 50) : "Untitled Task");
            }
            if (data.status === 'New') data.status = 'Pending';
            if (data.status === 'Done') data.status = 'Completed';

            console.log(`[TasksController] Creating task for user ${userId}:`, { title: data.title });

            const task = await this.service.createTask(req.user, data);
            sendSuccess(res, task, 'Task created successfully', 201);

        } catch (error) {
            console.error('[TasksController] createTask Error:', error);
            if (next) next(error);
            else {
                // Fallback if next is missing
                res.status(500).json({ success: false, error: error.message });
            }
        }
    }

    updateTask = async (req, res, next) => {
        try {
            const schema = z.object({
                title: z.string().optional(),
                description: z.string().optional(),
                priority: z.enum(['Low', 'Medium', 'High']).optional(),
                status: z.enum(['Pending', 'In Progress', 'Completed', 'deleted']).optional(),
                category: z.string().optional(),
                assignedToEmail: z.string().email().optional().or(z.literal('')),
                dueDate: z.string().datetime().nullable().optional(),
                notes: z.string().optional(),
                due_date: z.string().datetime().nullable().optional(), // Adding due_date support
                reminderAt: z.string().datetime().nullable().optional()
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            // PATCH: Partial update logic is handled in Service
            const task = await this.service.updateTask(req.params.id, req.user, result.data);
            sendSuccess(res, task);
        } catch (error) {
            console.error('[TasksController] updateTask Error:', error);
            if (next) next(error);
            else sendError(res, error);
        }
    }

    deleteTask = async (req, res, next) => {
        try {
            await this.service.softDelete(req.params.id, req.user);
            sendSuccess(res, null, 'Task deleted successfully');
        } catch (error) {
            console.error('[TasksController] deleteTask Error:', error);
            if (next) next(error);
            else sendError(res, error);
        }
    }
}
