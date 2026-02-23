import { TasksRepository } from './tasks.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { AppError } from '../../utils/app-error.js';

import { maskPhone } from '../../utils/phone-utils.js';
import { ensureTaskAccess } from './task-auth.js';

export class TasksService {
    constructor() {
        this.repository = new TasksRepository();
        this.usersRepository = new UsersRepository();
    }

    async getTasks(user, filters = {}, pagination = {}) {
        // Enforce user ownership (OR assigned)
        filters.uid = user.uid;
        const tasks = await this.repository.find(filters, pagination);

        // Masking logic
        return tasks.map(task => this._applyMasking(task, user));
    }

    async getAssignedTasks(user, filters = {}, pagination = {}) {
        filters.uid = user.uid;
        filters.email = user.email; // Pass email for loose matching
        filters.onlyAssigned = true;

        const tasks = await this.repository.find(filters, pagination);
        return tasks.map(task => this._applyMasking(task, user));
    }

    async getTask(id, user) {
        const task = await this.repository.findById(id);
        if (!task) throw new AppError('Task not found', 404);

        // Security Check: Owner OR Assigned
        ensureTaskAccess(task, user);

        return this._applyMasking(task, user);
    }

    _applyMasking(task, currentUser) {
        if (task.user_id === currentUser.uid) return task; // Owner sees all

        // I am assignee. Check Owner's preference.
        // Since we don't have owner's preference loaded here easily, 
        // we will DEFAULT to MASKED for safety as per requirements.
        // todo: In future, fetch task.owner.preferences to check 'shareCallerDetails'

        const maskedTask = { ...task };
        if (maskedTask.caller_phone_e164) maskedTask.caller_phone_e164 = maskPhone(maskedTask.caller_phone_e164);
        if (maskedTask.from_phone) maskedTask.from_phone = maskPhone(maskedTask.from_phone);

        return maskedTask;
    }

    async createTask(user, data) {
        const title = data.title || (data.description ? data.description.substring(0, 50) : 'Untitled Task');

        // Resolve Assignment
        let assignedToUserId = null;
        let assignedToEmail = null;

        if (data.assignedToEmail) {
            // Check if user exists
            const assignee = await this.usersRepository.findByEmail(data.assignedToEmail);
            if (assignee) {
                assignedToUserId = assignee.id;
            } else {
                assignedToEmail = data.assignedToEmail; // Pending invite
            }
        }

        const newTask = {
            uid: user.uid,
            title,
            description: data.description || '',
            fromName: data.fromName || '',
            fromPhone: data.fromPhone || '',
            category: data.category || 'General',
            priority: data.priority || 'Medium',
            status: data.status || 'Pending',
            notes: data.notes || '',
            reminderAt: data.reminderAt || null,
            dueDate: data.dueDate || null,
            reminderSent: false,
            // Assignment
            assigned_to_user_id: assignedToUserId,
            assigned_to_email: assignedToEmail
        };

        return this.repository.create(newTask);
    }

    async updateTask(id, user, data) {
        // checks existence and ownership
        const task = await this.getTask(id, user);

        const isOwner = task.user_id === user.uid;
        const isAssigned = task.assigned_to_user_id === user.uid;

        if (!isOwner && !isAssigned) {
            throw new AppError('Forbidden', 403);
        }

        // Whitelist allowed updates
        const allowedUpdates = ['title', 'description', 'fromName', 'fromPhone', 'category', 'priority', 'status', 'notes', 'reminderAt', 'dueDate'];
        const updates = {};

        Object.keys(data).forEach(key => {
            if (allowedUpdates.includes(key) && data[key] !== undefined) {
                if (isOwner) {
                    updates[key] = data[key];
                } else if (isAssigned) {
                    // Assignee restricted fields
                    if (['status', 'notes'].includes(key)) {
                        updates[key] = data[key];
                    }
                }
            }
        });

        // Handle Assignment Update (Only Owner can re-assign)
        if (data.assignedToEmail !== undefined && isOwner) {
            if (!data.assignedToEmail) {
                // Clear assignment
                updates.assigned_to_user_id = null;
                updates.assigned_to_email = null;
            } else {
                const assignee = await this.usersRepository.findByEmail(data.assignedToEmail);
                if (assignee) {
                    updates.assigned_to_user_id = assignee.id;
                    updates.assigned_to_email = null; // Clear email if resolved
                } else {
                    updates.assigned_to_user_id = null;
                    updates.assigned_to_email = data.assignedToEmail;
                }
            }
        }

        // Reset reminderSent if reminderAt changes
        if (updates.reminderAt && updates.reminderAt !== task.reminderAt) {
            updates.reminderSent = false;
        }

        if (Object.keys(updates).length === 0) return task;

        return this.repository.update(id, updates);
    }

    async shareTask(id, user) {
        // Not implemented in DB schema for now
        throw new AppError('Sharing via link temporarily disabled', 501);
    }

    async getSharedTask(token) {
        throw new AppError('Sharing via link temporarily disabled', 501);
    }

    async processReminders() {
        // Prisma repo needs 'reminderDue' filter implementation in 'find'
        // But for now, returning empty to avoid errors
        return [];
    }

    async softDelete(id, user) {
        const task = await this.getTask(id, user); // checks existence and basic access

        // Strict Owner Check for Deletion
        if (task.user_id !== user.uid) {
            throw new AppError('Forbidden: Only the task owner can delete this task', 403);
        }

        return this.repository.softDelete(id);
    }

    async assignTask(id, user, email) {
        const task = await this.getTask(id, user);

        if (task.user_id !== user.uid) {
            throw new AppError('Forbidden: Only the task owner can assign this task', 403);
        }

        const updates = {};
        if (!email) {
            updates.assigned_to_user_id = null;
            updates.assigned_to_email = null;
        } else {
            const assignee = await this.usersRepository.findByEmail(email);
            if (assignee) {
                updates.assigned_to_user_id = assignee.id;
                updates.assigned_to_email = null;
            } else {
                updates.assigned_to_user_id = null;
                updates.assigned_to_email = email;
            }
        }

        return this.repository.update(id, updates);
    }
}
