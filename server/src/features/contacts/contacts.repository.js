import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ContactsRepository {
    async find(userId, filters = {}, pagination = {}) {
        const where = { owner_user_id: userId };
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { phone_e164: { contains: filters.search } },
                { email: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        const contacts = await prisma.contact.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: pagination.limit ? Number(pagination.limit) : undefined,
            skip: pagination.offset ? Number(pagination.offset) : undefined
        });
        return contacts;
    }

    async findById(id) {
        return prisma.contact.findUnique({ where: { id } });
    }

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

    async create(data) {
        return prisma.contact.create({ data });
    }

    async update(id, data) {
        return prisma.contact.update({ where: { id }, data });
    }

    async delete(id) {
        return prisma.contact.delete({ where: { id } });
    }
}
