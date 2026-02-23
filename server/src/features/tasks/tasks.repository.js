import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Reusable label include
const LABEL_INCLUDE = {
    task_labels: {
        include: { label: true }
    }
};

function mapTask(t) {
    return {
        ...t,
        uid: t.user_id,
        assigned_to_email: t.assigned_to ? t.assigned_to.primary_email_id : t.assigned_to_email,
        labels: (t.task_labels || []).map(tl => tl.label)
    };
}

export class TasksRepository {
    async find(filters = {}, pagination = {}, sort = { field: 'created_at', direction: 'desc' }) {
        const where = {
            deleted_at: filters.includeDeleted ? undefined : null
        };

        // Access Control & Filters
        if (filters.uid) {
            if (filters.onlyAssigned) {
                // strict check for assigned tasks
                where.OR = [
                    { assigned_to_user_id: filters.uid }
                ];
                if (filters.email) {
                    where.OR.push({ assigned_to_email: filters.email });
                }
            } else {
                // OR logic: Task is owned by user OR assigned to user (My Tasks view)
                where.OR = [
                    { user_id: filters.uid },
                    { assigned_to_user_id: filters.uid }
                ];
                // For "My Tasks", we usually include tasks assigned to my email too if we want to be complete, 
                // but legacy logic was just ID. Let's stick to existing logic for the else block unless requested.
            }
        }

        if (filters.category) where.category = filters.category;
        if (filters.project_id) where.project_id = filters.project_id;

        if (filters.startDate || filters.endDate) {
            where.due_date = {};
            if (filters.startDate) where.due_date.gte = new Date(filters.startDate);
            if (filters.endDate) where.due_date.lte = new Date(filters.endDate);
        }

        // Search: match title, description, or any label name (visible tasks only)
        if (filters.search) {
            const searchTerm = filters.search;
            const searchConditions = [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                {
                    task_labels: {
                        some: {
                            label: {
                                name: { contains: searchTerm, mode: 'insensitive' }
                            }
                        }
                    }
                }
            ];

            // If we already have OR from uid, wrap with AND
            if (where.OR) {
                const accessConditions = where.OR;
                delete where.OR;
                where.AND = [
                    { OR: accessConditions },
                    { OR: searchConditions }
                ];
            } else {
                where.OR = searchConditions;
            }
        }

        if (filters.search) {
            where.AND = {
                OR: [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ]
            };
        }

        const orderBy = {};
        orderBy[sort.field || 'created_at'] = sort.direction || 'desc';

        const tasks = await prisma.task.findMany({
            where,
            orderBy,
            take: pagination.limit ? Number(pagination.limit) : undefined,
            skip: pagination.offset ? Number(pagination.offset) : undefined,
            include: {
                user: { select: { id: true, primary_email_id: true } },
                assigned_to: { select: { id: true, primary_email_id: true } },
                ...LABEL_INCLUDE
            }
        });

        return tasks.map(mapTask);
    }

    async findById(id) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, primary_email_id: true } },
                assigned_to: { select: { id: true, primary_email_id: true } },
                ...LABEL_INCLUDE
            }
        });
        if (!task) return null;
        return mapTask(task);
    }

    async create(data) {
        // Data contains: title, description... and uid (which is user_id)
        // Also map camelCase to snake_case for Prisma
        const { uid, assigned_to_email, fromName, fromPhone, reminderAt, reminderSent, dueDate, recurrenceRule, recurrenceAnchorDate, nextInstanceId, projectId, ...rest } = data;

        const task = await prisma.task.create({
            data: {
                ...rest,
                from_name: fromName,
                from_phone: fromPhone,
                due_date: dueDate,
                assigned_to_email, // Explicitly pass if present
                user_id: uid,
                recurrence_rule: recurrenceRule,
                recurrence_anchor_date: recurrenceAnchorDate,
                next_instance_id: nextInstanceId,
                project_id: projectId,
                // Ensure no null/undefined fields that Prisma doesn't like or rely on defaults
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        return { ...task, uid: task.user_id, labels: [] };
    }

    async update(id, data) {
        const { fromName, fromPhone, dueDate, recurrenceRule, recurrenceAnchorDate, nextInstanceId, projectId, ...rest } = data;
        const updateData = {
            ...rest,
            updated_at: new Date()
        };
        if (fromName !== undefined) updateData.from_name = fromName;
        if (fromPhone !== undefined) updateData.from_phone = fromPhone;
        if (dueDate !== undefined) updateData.due_date = dueDate;
        if (recurrenceRule !== undefined) updateData.recurrence_rule = recurrenceRule;
        if (recurrenceAnchorDate !== undefined) updateData.recurrence_anchor_date = recurrenceAnchorDate;
        if (nextInstanceId !== undefined) updateData.next_instance_id = nextInstanceId;
        if (projectId !== undefined) updateData.project_id = projectId;

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, primary_email_id: true } },
                assigned_to: { select: { id: true, primary_email_id: true } },
                ...LABEL_INCLUDE
            }
        });
        return mapTask(task);
    }

    async softDelete(id) {
        const task = await prisma.task.update({
            where: { id },
            data: {
                status: 'deleted',
                deleted_at: new Date()
            }
        });
        return { ...task, uid: task.user_id, labels: [] };
    }

    async setLabels(taskId, labelIds) {
        await prisma.$transaction([
            prisma.taskLabel.deleteMany({ where: { task_id: taskId } }),
            prisma.taskLabel.createMany({
                data: labelIds.map(label_id => ({ task_id: taskId, label_id })),
                skipDuplicates: true
            })
        ]);
        // Return updated task with labels
        return this.findById(taskId);
    }
}
