import { TasksService } from './tasks.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

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
            const task = await this.service.createTask(req.user, req.body);
            sendSuccess(res, task, 'Task created successfully', 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async updateTask(req, res) {
        try {
            const task = await this.service.updateTask(req.params.id, req.user, req.body);
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
