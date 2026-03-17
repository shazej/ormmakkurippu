/**
 * TaskSharingRepository
 *
 * All database access for TaskShareLink records.
 * Used by both the task-sharing feature (public viewer) and the tasks feature
 * (owner management of links).
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class TaskSharingRepository {
    /**
     * Generate a cryptographically secure, URL-safe token.
     * 32 random bytes → 43-char base64url string.
     * base64url is safe in URLs without encoding and avoids +/= characters.
     */
    _generateToken() {
        return crypto.randomBytes(32).toString('base64url');
    }

    /**
     * Create a new share link for a task.
     * @param {string} taskId
     * @param {string} createdBy - user_id of the owner creating the link
     * @param {Date|null} expiresAt - null means the link never expires
     * @returns {Promise<object>} The created TaskShareLink record
     */
    async create(taskId, createdBy, expiresAt = null) {
        const token = this._generateToken();

        return prisma.taskShareLink.create({
            data: {
                task_id: taskId,
                token,
                created_by: createdBy,
                expires_at: expiresAt,
                permissions: { view: true }
            }
        });
    }

    /**
     * Find an active (not revoked, not expired) share link by token.
     *
     * Returns null if:
     *   - the token does not exist
     *   - the link has been revoked
     *   - the link has passed its expiry date
     *   - the related task has been soft-deleted
     *   - the related task record is unexpectedly missing (defensive guard)
     */
    async findActiveByToken(token) {
        const link = await prisma.taskShareLink.findUnique({
            where: { token },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        priority: true,
                        status: true,
                        due_date: true,
                        created_at: true,
                        updated_at: true,
                        deleted_at: true,
                        // Deliberately excluded: from_name, from_phone,
                        // caller_phone_e164, notes, assigned_to_user_id,
                        // assigned_to_email, user_id — internal/sensitive fields
                    }
                }
            }
        });

        if (!link) return null;
        if (link.revoked_at) return null;
        if (link.expires_at && link.expires_at < new Date()) return null;

        // Guard: task should always exist due to FK cascade, but defensive
        // null check prevents a crash if the task was hard-deleted at DB level.
        if (!link.task || link.task.deleted_at) return null;

        return link;
    }

    /**
     * Increment access counter and record the access timestamp.
     *
     * Fire-and-forget: callers must NOT await this in the response path.
     * A failure here must never surface to the client.
     */
    async recordAccess(token) {
        await prisma.taskShareLink.update({
            where: { token },
            data: {
                access_count: { increment: 1 },
                last_accessed_at: new Date()
            }
        });
    }

    /**
     * List all share links for a given task (including revoked, for audit).
     */
    async findByTaskId(taskId) {
        return prisma.taskShareLink.findMany({
            where: { task_id: taskId },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Soft-revoke a specific share link.
     *
     * Uses updateMany with compound conditions to:
     *   1. Ensure the token belongs to the expected task (prevents cross-task revocation)
     *   2. Skip already-revoked links (idempotent safety)
     *   3. Eliminate the find-then-update TOCTOU race of the previous pattern
     *
     * Returns an object with revoked metadata if successful, null if nothing matched.
     */
    async revokeByToken(token, taskId) {
        const revokedAt = new Date();

        const result = await prisma.taskShareLink.updateMany({
            where: {
                token,
                task_id: taskId,
                revoked_at: null  // Idempotent: skip already-revoked links
            },
            data: { revoked_at: revokedAt }
        });

        // updateMany returns { count: n }. Return null when nothing matched.
        return result.count > 0 ? { token, revokedAt } : null;
    }
}
