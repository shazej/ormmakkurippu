import { TasksRepository } from './tasks.repository.js';
import { AppError } from '../../utils/app-error.js';

export class TasksService {
    constructor() {
        this.repository = new TasksRepository();
    }

    async getTasks(user, filters = {}, pagination = {}) {
        // Enforce user ownership
        filters.uid = user.uid;
        return this.repository.find(filters, pagination);
    }

    async getTask(id, user) {
        const task = await this.repository.findById(id);
        if (!task) throw new AppError('Task not found', 404);

        // Security Check
        if (task.uid !== user.uid) throw new AppError('Forbidden', 403);

        return task;
    }

    async createTask(user, data) {
        const title = data.title || (data.description ? data.description.substring(0, 50) : 'Untitled Task');

        const newTask = {
            uid: user.uid,
            title,
            description: data.description || '',
            fromName: data.fromName || '',
            fromPhone: data.fromPhone || '',
            category: data.category || 'General',
            priority: data.priority || 'Medium',
            status: data.status || 'Pending',
            notes: data.notes || ''
        };

        return this.repository.create(newTask);
    }

    async updateTask(id, user, data) {
        // checks existence and ownership
        const task = await this.getTask(id, user);

        // Whitelist allowed updates
        const allowedUpdates = ['title', 'description', 'fromName', 'fromPhone', 'category', 'priority', 'status', 'notes'];
        const updates = {};

        Object.keys(data).forEach(key => {
            if (allowedUpdates.includes(key) && data[key] !== undefined) {
                updates[key] = data[key];
            }
        });

        if (Object.keys(updates).length === 0) return task;

        return this.repository.update(id, updates);
    }

    async deleteTask(id, user) {
        await this.getTask(id, user); // checks existence and ownership
        return this.repository.softDelete(id);
    }
}
