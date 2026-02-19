import { AppError } from '../../utils/app-error.js';

/**
 * Ensures that the user has access to the task.
 * Access Rules:
 * - Owner (user_id === user.uid)
 * - Assignee (assigned_to_user_id === user.uid)
 * 
 * Throws 403 Forbidden if access is denied.
 * 
 * @param {Object} task - The task object from DB
 * @param {Object} user - The authenticated user object (must have uid)
 * @throws {AppError}
 */
export const ensureTaskAccess = (task, user) => {
    if (!task) throw new AppError('Task not found', 404);
    if (!user || !user.uid) throw new AppError('Unauthorized', 401);

    const isOwner = task.user_id === user.uid;
    const isAssigned = task.assigned_to_user_id === user.uid;

    if (!isOwner && !isAssigned) {
        throw new AppError('Forbidden: You do not have access to this task', 403);
    }
};
