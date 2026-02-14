import { AdminService } from './admin.service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

export class AdminController {
    constructor() {
        this.service = new AdminService();
    }

    async getTasks(req, res) {
        try {
            const tasks = await this.service.getAllTasks();
            sendSuccess(res, tasks);
        } catch (error) {
            sendError(res, error);
        }
    }

    async deleteTask(req, res) {
        try {
            const result = await this.service.deleteTask(req.params.id, req.user);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async createTask(req, res) {
        try {
            const result = await this.service.createTask(req.body, req.user);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async updateTask(req, res) {
        try {
            const result = await this.service.updateTask(req.params.id, req.body, req.user);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAuditLogs(req, res) {
        try {
            const logs = await this.service.getAuditLogs();
            sendSuccess(res, logs);
        } catch (error) {
            sendError(res, error);
        }
    }
}
