import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class TasksRepository {
    async find(filters = {}, pagination = {}, sort = { field: 'created_at', direction: 'desc' }) {
        const where = {
            deleted_at: filters.includeDeleted ? undefined : null
        };

        // Access Control & Filters
        if (filters.uid) {
            // OR logic: Task is owned by user OR assigned to user
            where.OR = [
                { user_id: filters.uid },
                { assigned_to_user_id: filters.uid }
            ];
        }

        if (filters.category) where.category = filters.category;

        const orderBy = {};
        orderBy[sort.field || 'created_at'] = sort.direction || 'desc';

        const tasks = await prisma.task.findMany({
            where,
            orderBy,
            take: pagination.limit ? Number(pagination.limit) : undefined,
            skip: pagination.offset ? Number(pagination.offset) : undefined,
            include: {
                user: { select: { id: true, primary_email_id: true } },
                assigned_to: { select: { id: true, primary_email_id: true } }
            }
        });

        // Map to flat structure for backward compatibility
        return tasks.map(t => ({
            ...t,
            uid: t.user_id,
            assigned_to_email: t.assigned_to ? t.assigned_to.primary_email_id : t.assigned_to_email
        }));
    }

    async findById(id) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, primary_email_id: true } },
                assigned_to: { select: { id: true, primary_email_id: true } }
            }
        });
        if (!task) return null;
        return { ...task, uid: task.user_id };
    }

    async create(data) {
        // Data contains: title, description... and uid (which is user_id)
        // Also map camelCase to snake_case for Prisma
        const { uid, assigned_to_email, fromName, fromPhone, reminderAt, reminderSent, dueDate, ...rest } = data;

        const task = await prisma.task.create({
            data: {
                ...rest,
                from_name: fromName,
                from_phone: fromPhone,
                due_date: dueDate,
                assigned_to_email, // Explicitly pass if present
                user_id: uid,
                // Ensure no null/undefined fields that Prisma doesn't like or rely on defaults
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        return { ...task, uid: task.user_id };
    }

    async update(id, data) {
        const { fromName, fromPhone, dueDate, ...rest } = data;
        const updateData = {
            ...rest,
            updated_at: new Date()
        };
        if (fromName !== undefined) updateData.from_name = fromName;
        if (fromPhone !== undefined) updateData.from_phone = fromPhone;
        if (dueDate !== undefined) updateData.due_date = dueDate;

        const task = await prisma.task.update({
            where: { id },
            data: updateData
        });
        return { ...task, uid: task.user_id };
    }

    async softDelete(id) {
        const task = await prisma.task.update({
            where: { id },
            data: {
                status: 'deleted',
                deleted_at: new Date()
            }
        });
        return { ...task, uid: task.user_id };
    }
}
