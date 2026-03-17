/**
 * TaskSharingService
 *
 * Business logic for the public shared-task viewer.
 * Deliberately separate from TasksService because:
 *   1. It operates without authentication
 *   2. It enforces its own data-projection rules (no sensitive fields)
 *   3. It handles access telemetry
 */

import { TaskSharingRepository } from './task-sharing.repository.js';
import { AppError } from '../../utils/app-error.js';

export class TaskSharingService {
    constructor() {
        this.repository = new TaskSharingRepository();
    }

    /**
     * Resolve a share token to the safe public projection of a task.
     * Throws 404 if token is invalid, revoked, expired, or task is deleted.
     *
     * Access telemetry is recorded asynchronously — it does not block the
     * response and a failure there must never surface to the client.
     */
    async getTaskByToken(token) {
        const link = await this.repository.findActiveByToken(token);

        if (!link) {
            throw new AppError('Share link not found or has expired', 404);
        }

        // Record access in the background — do not await
        this.repository.recordAccess(token).catch(err => {
            console.error('[TaskSharingService] recordAccess failed:', err.message);
        });

        return this._projectPublicTask(link.task, link);
    }

    /**
     * Strip any sensitive or internal fields before returning task data
     * to an unauthenticated viewer.
     *
     * Allowed: id, title, description, category, priority, status, due_date,
     *          created_at, updated_at
     * Blocked: from_name, from_phone, caller_phone_e164, notes,
     *          assigned_to_user_id, assigned_to_email, user_id
     */
    _projectPublicTask(task, link) {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
            created_at: task.created_at,
            updated_at: task.updated_at,

            // Metadata about the share link itself (useful for the UI)
            share: {
                expires_at: link.expires_at,
                permissions: link.permissions
            }
        };
    }
}
