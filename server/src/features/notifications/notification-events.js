import { NotificationsService } from './notifications.service.js';

const notificationsService = new NotificationsService();

/**
 * Helper functions for generating notifications from domain events.
 * Call these from controllers/services when relevant events happen.
 * All calls are fire-and-forget (non-blocking).
 */

/**
 * Notify when a task is assigned to a user.
 */
export async function notifyTaskAssigned({ task, assigneeUserId, assigneeEmail, assignerName }) {
    try {
        await notificationsService.notify({
            userId: assigneeUserId,
            type: 'TASK_ASSIGNED',
            title: 'Task assigned to you',
            message: `${assignerName || 'Someone'} assigned you the task "${task.title}".`,
            linkUrl: `/app/tasks/${task.id}`,
            entityType: 'task',
            entityId: task.id,
            recipientEmail: assigneeEmail,
            data: { assignerName, taskTitle: task.title },
        });
    } catch (err) {
        console.error('[NotificationEvents] notifyTaskAssigned failed:', err.message);
    }
}

/**
 * Notify collaborators when a shared task is updated.
 * @param {object} params
 * @param {object} params.task - The updated task
 * @param {string} params.actorUserId - User who made the change (excluded from notifications)
 * @param {string} params.actorName
 * @param {string[]} params.changes - List of changed fields (e.g., ['status', 'due_date'])
 */
export async function notifySharedTaskUpdate({ task, actorUserId, actorName, changes }) {
    try {
        // Only notify for meaningful changes
        const meaningfulChanges = changes.filter(c =>
            ['title', 'status', 'due_date', 'dueDate', 'priority', 'assigned_to_user_id', 'assignedToEmail'].includes(c)
        );
        if (meaningfulChanges.length === 0) return;

        const changeDesc = meaningfulChanges.map(c => {
            const labels = {
                title: 'title',
                status: 'status',
                due_date: 'due date',
                dueDate: 'due date',
                priority: 'priority',
                assigned_to_user_id: 'assignment',
                assignedToEmail: 'assignment',
            };
            return labels[c] || c;
        }).join(', ');

        const message = `${actorName || 'Someone'} updated the ${changeDesc} of "${task.title}".`;

        // Determine who to notify: owner + assignee, excluding the actor
        // Build a map of userId -> email for email delivery
        const recipients = new Map();
        if (task.user_id && task.user_id !== actorUserId) {
            recipients.set(task.user_id, task.user?.primary_email_id || null);
        }
        if (task.assigned_to_user_id && task.assigned_to_user_id !== actorUserId) {
            recipients.set(task.assigned_to_user_id, task.assigned_to?.primary_email_id || task.assigned_to_email || null);
        }

        for (const [userId, recipientEmail] of recipients) {
            await notificationsService.notify({
                userId,
                type: 'SHARED_TASK_UPDATE',
                title: 'Shared task updated',
                message,
                linkUrl: `/app/tasks/${task.id}`,
                entityType: 'task',
                entityId: task.id,
                recipientEmail,
                skipDedup: true, // Each meaningful update should notify separately
                data: { actorName, changes: meaningfulChanges, taskTitle: task.title },
            });
        }
    } catch (err) {
        console.error('[NotificationEvents] notifySharedTaskUpdate failed:', err.message);
    }
}

/**
 * Notify user about subscription/billing events.
 */
export async function notifySubscriptionAlert({ userId, userEmail, event, details }) {
    try {
        const eventMessages = {
            subscription_activated: {
                title: 'Subscription activated',
                message: 'Your subscription has been activated. Enjoy the full features!',
            },
            payment_failed: {
                title: 'Payment failed',
                message: 'Your payment could not be processed. Please update your payment method to avoid service interruption.',
            },
            subscription_canceled: {
                title: 'Subscription canceled',
                message: 'Your subscription has been canceled and will end at the current billing period.',
            },
            trial_ending_soon: {
                title: 'Trial ending soon',
                message: 'Your free trial ends soon. Upgrade to continue using premium features.',
            },
            subscription_renewed: {
                title: 'Subscription renewed',
                message: 'Your subscription has been renewed successfully.',
            },
            subscription_resumed: {
                title: 'Subscription resumed',
                message: 'Your subscription has been resumed.',
            },
        };

        const msg = eventMessages[event] || {
            title: 'Subscription update',
            message: `Your subscription status has changed: ${event}`,
        };

        await notificationsService.notify({
            userId,
            type: 'SUBSCRIPTION_ALERT',
            title: msg.title,
            message: msg.message,
            linkUrl: '/app/settings',
            entityType: 'subscription',
            entityId: event,
            recipientEmail: userEmail,
            data: { event, ...details },
        });
    } catch (err) {
        console.error('[NotificationEvents] notifySubscriptionAlert failed:', err.message);
    }
}
