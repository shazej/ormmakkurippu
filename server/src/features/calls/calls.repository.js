import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class CallLogsRepository {
    async find(userId, filters = {}, pagination = {}) {
        const where = {
            owner_user_id: userId,
            deleted_at: null
        };

        if (filters.direction) {
            where.direction = filters.direction.toUpperCase();
        }

        if (filters.contact_id) {
            where.contact_id = filters.contact_id;
        }

        if (filters.linked === 'true') {
            where.contact_id = { not: null };
        } else if (filters.linked === 'false') {
            where.contact_id = null;
        }

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
            take: pagination.limit ? Number(pagination.limit) : 100,
            skip: pagination.offset ? Number(pagination.offset) : 0,
            include: {
                contact: true,
                tasks: { select: { id: true, title: true, status: true, deleted_at: true } }
            }
        });
        return logs;
    }

    async findById(id) {
        return prisma.callLog.findUnique({
            where: { id },
            include: {
                contact: true,
                tasks: { select: { id: true, title: true, status: true, deleted_at: true } }
            }
        });
    }

    async create(data) {
        return prisma.callLog.create({
            data,
            include: {
                contact: true,
                tasks: { select: { id: true, title: true, status: true, deleted_at: true } }
            }
        });
    }

    async update(id, data) {
        return prisma.callLog.update({
            where: { id },
            data,
            include: {
                contact: true,
                tasks: { select: { id: true, title: true, status: true, deleted_at: true } }
            }
        });
    }

    async softDelete(id) {
        return prisma.callLog.update({
            where: { id },
            data: { deleted_at: new Date() }
        });
    }
}
