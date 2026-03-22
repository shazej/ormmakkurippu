import { PrismaClient } from '@prisma/client';
import { NotificationsService } from './notifications.service.js';

const prisma = new PrismaClient();

/**
 * Processes task due date reminders.
 * Finds tasks due within the next 24 hours that haven't had a reminder sent,
 * and creates notifications for task owners and assignees.
 */
export class ReminderProcessor {
    constructor() {
        this.notificationsService = new NotificationsService();
    }

    async processReminders() {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find tasks that are due within 24 hours or overdue, not yet reminded, not deleted/completed
        const tasks = await prisma.task.findMany({
            where: {
                due_date: { lte: in24Hours },
                reminder_sent_at: null,
                deleted_at: null,
                status: { notIn: ['Completed', 'deleted'] },
            },
            include: {
                user: { select: { id: true, primary_email_id: true, display_name: true } },
                assigned_to: { select: { id: true, primary_email_id: true, display_name: true } },
            },
            take: 100, // Process in batches
        });

        const results = { processed: 0, notifications: 0 };

        for (const task of tasks) {
            try {
                const isOverdue = task.due_date < now;
                const label = isOverdue ? 'overdue' : 'due soon';
                const title = isOverdue
                    ? `Task overdue: ${task.title}`
                    : `Task due soon: ${task.title}`;
                const message = isOverdue
                    ? `"${task.title}" was due on ${task.due_date.toLocaleDateString()}. Please update or complete it.`
                    : `"${task.title}" is due on ${task.due_date.toLocaleDateString()}. Don't forget!`;

                // Notify task owner
                await this.notificationsService.notify({
                    userId: task.user_id,
                    type: 'TASK_DUE_REMINDER',
                    title,
                    message,
                    linkUrl: `/app/tasks/${task.id}`,
                    entityType: 'task',
                    entityId: task.id,
                    recipientEmail: task.user?.primary_email_id,
                    data: { label, dueDate: task.due_date.toISOString() },
                });
                results.notifications++;

                // Notify assignee if different from owner
                if (task.assigned_to_user_id && task.assigned_to_user_id !== task.user_id) {
                    await this.notificationsService.notify({
                        userId: task.assigned_to_user_id,
                        type: 'TASK_DUE_REMINDER',
                        title,
                        message,
                        linkUrl: `/app/tasks/${task.id}`,
                        entityType: 'task',
                        entityId: task.id,
                        recipientEmail: task.assigned_to?.primary_email_id,
                        data: { label, dueDate: task.due_date.toISOString() },
                    });
                    results.notifications++;
                }

                // Mark reminder as sent
                await prisma.task.update({
                    where: { id: task.id },
                    data: { reminder_sent_at: now },
                });

                results.processed++;
            } catch (err) {
                console.error(`[ReminderProcessor] Error processing task ${task.id}:`, err.message);
            }
        }

        if (results.processed > 0) {
            console.log(`[ReminderProcessor] Processed ${results.processed} tasks, sent ${results.notifications} notifications`);
        }

        return results;
    }
}
