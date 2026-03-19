import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ProjectsRepository {
    async findByWorkspaceId(workspaceId, { includeArchived = false } = {}) {
        return prisma.project.findMany({
            where: {
                workspace_id: workspaceId,
                ...(includeArchived ? {} : { archived_at: null })
            },
            orderBy: { created_at: 'asc' }
        });
    }

    async findById(id) {
        return prisma.project.findUnique({ where: { id } });
    }

    async create({ workspaceId, name, color, createdByUserId }) {
        return prisma.project.create({
            data: {
                workspace_id: workspaceId,
                name,
                color: color || null,
                created_by_user_id: createdByUserId
            }
        });
    }

    async update(id, { name, color }) {
        const data = {};
        if (name !== undefined) data.name = name;
        if (color !== undefined) data.color = color;
        return prisma.project.update({ where: { id }, data });
    }

    async archive(id) {
        return prisma.project.update({
            where: { id },
            data: { archived_at: new Date() }
        });
    }

    async unarchive(id) {
        return prisma.project.update({
            where: { id },
            data: { archived_at: null }
        });
    }
}
