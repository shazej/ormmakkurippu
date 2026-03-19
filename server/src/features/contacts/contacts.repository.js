import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ContactsRepository {
    async find(userId, filters = {}) {
        const where = {
            owner_user_id: userId,
            deleted_at: null
        };
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { phone_e164: { contains: filters.search } },
                { email: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return prisma.contact.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                _count: { select: { call_logs: true, tasks: { where: { deleted_at: null } } } }
            }
        });
    }

    // Returns non-deleted contact only — safe default for all ownership/edit checks
    async findById(id) {
        return prisma.contact.findFirst({
            where: { id, deleted_at: null }
        });
    }

    // Internal: returns contact regardless of deleted_at (used for phone uniqueness edge cases)
    async findByIdIncludeDeleted(id) {
        return prisma.contact.findUnique({ where: { id } });
    }

    async findWithHistory(id, userId) {
        return prisma.contact.findFirst({
            where: { id, owner_user_id: userId, deleted_at: null },
            include: {
                call_logs: {
                    orderBy: { call_time: 'desc' },
                    take: 50
                },
                tasks: {
                    where: { deleted_at: null },
                    orderBy: { created_at: 'desc' },
                    take: 50
                }
            }
        });
    }

    // Returns contact even if soft-deleted (needed to check phone uniqueness against DB constraint)
    async findByPhone(userId, phone) {
        return prisma.contact.findUnique({
            where: {
                owner_user_id_phone_e164: {
                    owner_user_id: userId,
                    phone_e164: phone
                }
            }
        });
    }

    async findByEmail(userId, email) {
        return prisma.contact.findFirst({
            where: {
                owner_user_id: userId,
                email: { equals: email, mode: 'insensitive' },
                deleted_at: null
            }
        });
    }

    async create(data) {
        return prisma.contact.create({ data });
    }

    async update(id, data) {
        return prisma.contact.update({ where: { id }, data });
    }

    async softDelete(id) {
        return prisma.contact.update({
            where: { id },
            data: { deleted_at: new Date() }
        });
    }

    // Hard delete — used to free DB unique slots occupied by soft-deleted contacts
    async hardDelete(id) {
        return prisma.contact.delete({ where: { id } });
    }

    // Retroactively link unlinked call logs to a contact by phone
    async relinkCallsByPhone(userId, phone, contactId) {
        return prisma.callLog.updateMany({
            where: {
                owner_user_id: userId,
                caller_phone_e164: phone,
                contact_id: null
            },
            data: { contact_id: contactId }
        });
    }
}
