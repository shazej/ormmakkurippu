import { AdminRepository } from './admin.repository.js';
import { logAudit } from './audit.js';

export class AdminService {
    constructor() {
        this.repository = new AdminRepository();
    }

    async getAllTasks() {
        return this.repository.getAllTasks();
    }

    async deleteTask(id, adminUser) {
        await this.repository.deleteTask(id);
        await logAudit(adminUser, 'DELETE_TASK', 'task', id, { reason: 'Admin deletion' });
        return { status: 'success' };
    }

    async createTask(data, adminUser) {
        const task = await this.repository.createTask(data, adminUser.uid);
        await logAudit(adminUser, 'CREATE_TASK', 'task', task.id, { title: data.title });
        return task;
    }

    async updateTask(id, data, adminUser) {
        await this.repository.updateTask(id, data);
        await logAudit(adminUser, 'UPDATE_TASK', 'task', id, { updates: Object.keys(data) });
        return { status: 'success' };
    }

    async getAuditLogs() {
        return this.repository.getAuditLogs();
    }
}
