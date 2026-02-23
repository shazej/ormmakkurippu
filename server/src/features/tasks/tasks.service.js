import { TasksRepository } from './tasks.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { ProjectsRepository } from '../projects/projects.repository.js';
import { LabelsRepository } from '../labels/labels.repository.js';
import { AppError } from '../../utils/app-error.js';
import * as fastcsv from 'fast-csv';
import { Readable } from 'stream';

import { maskPhone } from '../../utils/phone-utils.js';
import { ensureTaskAccess } from './task-auth.js';

export class TasksService {
    constructor() {
        this.repository = new TasksRepository();
        this.usersRepository = new UsersRepository();
        this.projectsRepository = new ProjectsRepository();
        this.labelsRepository = new LabelsRepository();
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

    async getTodayTasks(user, timezone = 'Asia/Qatar') {
        const now = new Date();
        const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        return this.getTasks(user, {
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        });
    }

    async getUpcomingTasks(user, days = 14, timezone = 'Asia/Qatar') {
        const now = new Date();
        const startOfRange = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        startOfRange.setHours(0, 0, 0, 0);

        const endOfRange = new Date(startOfRange);
        endOfRange.setDate(endOfRange.getDate() + parseInt(days));
        endOfRange.setHours(23, 59, 59, 999);

        return this.getTasks(user, {
            startDate: startOfRange.toISOString(),
            endDate: endOfRange.toISOString()
        });
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
            assigned_to_email: assignedToEmail,
            // Recurrence
            recurrenceRule: data.recurrenceRule || null,
            recurrenceAnchorDate: data.recurrenceAnchorDate || data.dueDate || null,
            projectId: data.projectId || null
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
        const allowedUpdates = ['title', 'description', 'fromName', 'fromPhone', 'category', 'priority', 'status', 'notes', 'reminderAt', 'due_date', 'dueDate', 'recurrenceRule', 'recurrenceAnchorDate', 'projectId'];
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

        const updatedTask = await this.repository.update(id, updates);

        // Handle Recurrence on Completion
        if (updates.status === 'Completed' && updatedTask.recurrence_rule && isOwner) {
            await this._handleRecurrence(updatedTask, user);
        }

        return updatedTask;
    }

    async _handleRecurrence(task, user) {
        if (task.next_instance_id) return; // Already generated

        const nextDueDate = this._calculateNextDueDate(task.due_date || task.recurrence_anchor_date, task.recurrence_rule);
        if (!nextDueDate) return;

        const nextTaskData = {
            uid: task.user_id,
            title: task.title,
            description: task.description,
            fromName: task.from_name,
            fromPhone: task.from_phone,
            category: task.category,
            priority: task.priority,
            status: 'Pending',
            notes: task.notes,
            dueDate: nextDueDate.toISOString(),
            recurrenceRule: task.recurrence_rule,
            recurrenceAnchorDate: task.recurrence_anchor_date ? task.recurrence_anchor_date.toISOString() : null,
            projectId: task.project_id,
            assignedToEmail: task.assigned_to_email
        };

        const nextTask = await this.createTask(user, nextTaskData);

        // Copy Labels
        if (task.labels && task.labels.length > 0) {
            const labelIds = task.labels.map(l => l.id);
            await this.repository.setLabels(nextTask.id, labelIds);
        }

        // Link them for idempotency
        await this.repository.update(task.id, { nextInstanceId: nextTask.id });
    }

    _calculateNextDueDate(currentDate, rule) {
        if (!currentDate || !rule) return null;
        const next = new Date(currentDate);
        if (rule === 'daily') {
            next.setDate(next.getDate() + 1);
        } else if (rule === 'weekly') {
            next.setDate(next.getDate() + 7);
        } else if (rule === 'monthly') {
            next.setMonth(next.getMonth() + 1);
        } else {
            return null;
        }
        return next;
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

    async bulkTasks(user, { action, taskIds, email }) {
        const results = {
            successCount: 0,
            failed: []
        };

        for (const id of taskIds) {
            try {
                if (action === 'complete') {
                    await this.updateTask(id, user, { status: 'Completed' });
                } else if (action === 'reopen') {
                    await this.updateTask(id, user, { status: 'Pending' });
                } else if (action === 'delete') {
                    await this.deleteTask(id, user);
                } else if (action === 'assign') {
                    await this.updateTask(id, user, { assignedToEmail: email });
                } else {
                    throw new AppError(`Invalid action: ${action}`, 400);
                }
                results.successCount++;
            } catch (error) {
                console.error(`[TasksService] Bulk ${action} failed for task ${id}:`, error.message);
                results.failed.push({
                    id,
                    reason: error.message || 'Unknown error'
                });
            }
        }

        return results;
    }

    async exportTasksCsv(user) {
        const tasks = await this.repository.find({
            uid: user.uid,
            includeDeleted: false
        });

        const workspaces = await this.usersRepository.findWorkspaces(user.uid);
        const workspaceId = workspaces[0]?.id;
        const projects = workspaceId ? await this.projectsRepository.findByWorkspaceId(workspaceId) : [];
        const projectMap = new Map(projects.map(p => [p.id, p.name]));

        const formattedTasks = tasks.map(t => ({
            title: t.title,
            description: t.description || '',
            due_date: t.due_date ? t.due_date.toISOString() : '',
            status: t.status,
            project: projectMap.get(t.project_id) || '',
            labels: (t.labels || []).map(l => l.name).join(', ')
        }));

        return fastcsv.writeToString(formattedTasks, { headers: true });
    }

    async importTasksCsv(user, buffer) {
        const results = {
            successCount: 0,
            failed: [],
            total: 0
        };

        const rows = [];
        const stream = Readable.from(buffer.toString());

        await new Promise((resolve, reject) => {
            fastcsv.parseStream(stream, { headers: true })
                .on('data', (row) => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        results.total = rows.length;
        if (results.total > 5000) {
            throw new AppError('Import limit exceeded (max 5000 rows)', 400);
        }

        const workspaces = await this.usersRepository.findWorkspaces(user.uid);
        const workspaceId = workspaces[0]?.id;
        const projects = workspaceId ? await this.projectsRepository.findByWorkspaceId(workspaceId) : [];
        const projectMap = new Map(projects.map(p => [p.name.toLowerCase(), p.id]));

        const existingLabels = await this.labelsRepository.findByOwner(user.uid);
        const labelMap = new Map(existingLabels.map(l => [l.name.toLowerCase(), l.id]));

        for (const [index, row] of rows.entries()) {
            try {
                const { title, description, due_date, status, project, labels } = row;

                if (!title) {
                    throw new Error('Title is required');
                }

                const taskData = {
                    title,
                    description: description || '',
                    dueDate: due_date ? new Date(due_date).toISOString() : null,
                    status: status || 'Pending',
                    projectId: project ? projectMap.get(project.toLowerCase()) : null
                };

                const newTask = await this.createTask(user, taskData);

                if (labels) {
                    const labelNames = labels.split(',').map(l => l.trim().toLowerCase()).filter(l => l);
                    const labelIdsToSet = [];

                    for (const name of labelNames) {
                        let labelId = labelMap.get(name);
                        if (!labelId) {
                            const newLabel = await this.labelsRepository.create(
                                user.uid,
                                name.charAt(0).toUpperCase() + name.slice(1)
                            );
                            labelId = newLabel.id;
                            labelMap.set(name, labelId);
                        }
                        labelIdsToSet.push(labelId);
                    }

                    if (labelIdsToSet.length > 0) {
                        await this.repository.setLabels(newTask.id, labelIdsToSet);
                    }
                }

                results.successCount++;
            } catch (err) {
                results.failed.push({
                    row: index + 2,
                    reason: err.message
                });
            }
        }

        return results;
    }
}
