import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class NotificationsRepository {
    async findByUserId(userId, { limit = 30, offset = 0, unreadOnly = false } = {}) {
        const where = { user_id: userId };
        if (unreadOnly) where.is_read = false;

        return prisma.notification.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    async countUnread(userId) {
        return prisma.notification.count({
            where: { user_id: userId, is_read: false },
        });
    }

    async findById(id) {
        return prisma.notification.findUnique({ where: { id } });
    }

    async create(data) {
        return prisma.notification.create({ data });
    }

    async createMany(notifications) {
        if (notifications.length === 0) return [];
        await prisma.notification.createMany({ data: notifications });
        return notifications;
    }

    async markAsRead(id, userId) {
        return prisma.notification.updateMany({
            where: { id, user_id: userId },
            data: { is_read: true, read_at: new Date() },
        });
    }

    async markAllAsRead(userId) {
        return prisma.notification.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true, read_at: new Date() },
        });
    }

    /**
     * Check if a notification already exists for deduplication.
     */
    async exists(userId, type, entityType, entityId, sinceHoursAgo = 24) {
        const since = new Date(Date.now() - sinceHoursAgo * 60 * 60 * 1000);
        const count = await prisma.notification.count({
            where: {
                user_id: userId,
                type,
                entity_type: entityType,
                entity_id: entityId,
                created_at: { gte: since },
            },
        });
        return count > 0;
    }
}

export class NotificationPreferencesRepository {
    async findByUserId(userId) {
        return prisma.notificationPreference.findUnique({
            where: { user_id: userId },
        });
    }

    async upsert(userId, data) {
        return prisma.notificationPreference.upsert({
            where: { user_id: userId },
            update: { ...data, updated_at: new Date() },
            create: { user_id: userId, ...data },
        });
    }
}
