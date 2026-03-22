import { NotificationsRepository, NotificationPreferencesRepository } from './notifications.repository.js';
import { NotificationDeliveryService } from './notification-delivery.service.js';
import { AppError } from '../../utils/app-error.js';

const DEFAULT_PREFERENCES = {
    in_app_enabled: true,
    email_enabled: false,
    task_due_enabled: true,
    task_assigned_enabled: true,
    shared_task_updates_enabled: true,
    subscription_alerts_enabled: true,
    push_enabled: false,
};

// Map notification type to preference key
const TYPE_TO_PREF_KEY = {
    TASK_DUE_REMINDER: 'task_due_enabled',
    TASK_ASSIGNED: 'task_assigned_enabled',
    SHARED_TASK_UPDATE: 'shared_task_updates_enabled',
    SUBSCRIPTION_ALERT: 'subscription_alerts_enabled',
};

export class NotificationsService {
    constructor() {
        this.repository = new NotificationsRepository();
        this.preferencesRepository = new NotificationPreferencesRepository();
        this.deliveryService = new NotificationDeliveryService();
    }

    // ── Query Methods ──────────────────────────────────────────────────────

    async getNotifications(userId, { page = 1, limit = 30, unreadOnly = false } = {}) {
        const offset = (page - 1) * limit;
        const [notifications, unreadCount] = await Promise.all([
            this.repository.findByUserId(userId, { limit, offset, unreadOnly }),
            this.repository.countUnread(userId),
        ]);
        return { notifications, unreadCount, page, limit };
    }

    async getUnreadCount(userId) {
        return this.repository.countUnread(userId);
    }

    async markAsRead(notificationId, userId) {
        const notification = await this.repository.findById(notificationId);
        if (!notification) throw new AppError('Notification not found', 404);
        if (notification.user_id !== userId) throw new AppError('Forbidden', 403);

        await this.repository.markAsRead(notificationId, userId);
        return { success: true };
    }

    async markAllAsRead(userId) {
        const result = await this.repository.markAllAsRead(userId);
        return { success: true, count: result.count };
    }

    // ── Preferences ────────────────────────────────────────────────────────

    async getPreferences(userId) {
        const prefs = await this.preferencesRepository.findByUserId(userId);
        return prefs || { user_id: userId, ...DEFAULT_PREFERENCES };
    }

    async updatePreferences(userId, data) {
        return this.preferencesRepository.upsert(userId, data);
    }

    // ── Notification Creation (called by other services) ───────────────────

    /**
     * Create and deliver a notification respecting user preferences.
     * @param {object} params
     * @param {string} params.userId - Recipient user ID
     * @param {string} params.type - NotificationType enum value
     * @param {string} params.title
     * @param {string} params.message
     * @param {string} [params.linkUrl] - Frontend route
     * @param {string} [params.entityType]
     * @param {string} [params.entityId]
     * @param {object} [params.data] - Extra JSON metadata
     * @param {string} [params.recipientEmail] - For email delivery
     * @param {boolean} [params.skipDedup=false]
     */
    async notify({
        userId, type, title, message, linkUrl, entityType, entityId, data,
        recipientEmail, skipDedup = false,
    }) {
        // Check preferences
        const prefs = await this.getPreferences(userId);
        const prefKey = TYPE_TO_PREF_KEY[type];
        if (prefKey && !prefs[prefKey]) {
            return null; // User disabled this notification type
        }

        // Deduplication
        if (!skipDedup && entityType && entityId) {
            const alreadySent = await this.repository.exists(userId, type, entityType, entityId);
            if (alreadySent) return null;
        }

        // In-app notification
        let notification = null;
        if (prefs.in_app_enabled) {
            notification = await this.repository.create({
                user_id: userId,
                type,
                channel: 'IN_APP',
                title,
                message,
                link_url: linkUrl || null,
                entity_type: entityType || null,
                entity_id: entityId || null,
                data: data || null,
            });
        }

        // Email delivery (async, non-blocking)
        if (prefs.email_enabled && recipientEmail) {
            this.deliveryService.sendEmail({
                to: recipientEmail,
                subject: title,
                body: message,
                type,
            }).catch(err => {
                console.error(`[NotificationsService] Email delivery failed for ${userId}:`, err.message);
            });
        }

        return notification;
    }

    /**
     * Notify multiple users (e.g., shared task collaborators).
     */
    async notifyMany(userIds, params) {
        const results = [];
        for (const userId of userIds) {
            try {
                const n = await this.notify({ ...params, userId });
                if (n) results.push(n);
            } catch (err) {
                console.error(`[NotificationsService] notifyMany failed for user ${userId}:`, err.message);
            }
        }
        return results;
    }
}
