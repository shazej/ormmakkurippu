import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class LabelsRepository {
    async findByOwner(userId, search = '') {
        const where = { owner_user_id: userId };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        return prisma.label.findMany({
            where,
            orderBy: { name: 'asc' }
        });
    }

    async findById(id) {
        return prisma.label.findUnique({ where: { id } });
    }

    async create(userId, name, color = null) {
        return prisma.label.create({
            data: {
                owner_user_id: userId,
                name: name.trim(),
                color
            }
        });
    }

    async setTaskLabels(taskId, labelIds) {
        // Transactional replace: delete existing then insert new
        await prisma.$transaction([
            prisma.taskLabel.deleteMany({ where: { task_id: taskId } }),
            prisma.taskLabel.createMany({
                data: labelIds.map(label_id => ({ task_id: taskId, label_id })),
                skipDuplicates: true
            })
        ]);
    }
}
