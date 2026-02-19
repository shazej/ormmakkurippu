import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class CallLogsRepository {
    async find(userId, filters = {}, pagination = {}) {
        const where = { owner_user_id: userId };

        if (filters.search) {
            where.OR = [
                { caller_name: { contains: filters.search, mode: 'insensitive' } },
                { caller_phone_e164: { contains: filters.search } },
                { notes: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        const logs = await prisma.callLog.findMany({
            where,
            orderBy: { call_time: 'desc' },
            take: pagination.limit ? Number(pagination.limit) : undefined,
            skip: pagination.offset ? Number(pagination.offset) : undefined,
            include: {
                contact: true,
                tasks: { select: { id: true, title: true, status: true } }
            }
        });
        return logs;
    }

    async findById(id) {
        return prisma.callLog.findUnique({
            where: { id },
            include: { contact: true, tasks: true }
        });
    }

    async create(data) {
        return prisma.callLog.create({ data });
    }

    async update(id, data) {
        return prisma.callLog.update({ where: { id }, data });
    }
}
