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
            const schema = z.object({
                title: z.string().min(1).max(200),
                description: z.string().optional(),
                priority: z.enum(['Low', 'Medium', 'High']).optional(),
                status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
                category: z.string().optional()
            });
            const data = schema.parse(req.body);

            const task = await this.service.createTask(req.user, data);
            sendSuccess(res, task, 'Task created successfully', 201);
        } catch (error) {
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
                category: z.string().optional()
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
}
