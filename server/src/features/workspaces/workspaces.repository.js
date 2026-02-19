import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class WorkspacesRepository {
    async findByUserId(userId) {
        // Find workspaces where user is a member
        return prisma.workspace.findMany({
            where: {
                members: {
                    some: { user_id: userId, status: 'ACTIVE' }
                }
            },
            include: {
                members: {
                    include: { user: { select: { id: true, primary_email_id: true, google_uid: true } } }
                }
            }
        });
    }

    async findById(id) {
        return prisma.workspace.findUnique({
            where: { id },
            include: {
                members: {
                    include: { user: { select: { id: true, primary_email_id: true } } }
                }
            }
        });
    }

    async create(data, ownerId) {
        // Create workspace AND add owner as first member
        return prisma.workspace.create({
            data: {
                ...data,
                owner_user_id: ownerId,
                members: {
                    create: {
                        user_id: ownerId,
                        email: 'owner@placeholder', // Should be fetched from user, but for now placeholder
                        role: 'OWNER',
                        status: 'ACTIVE',
                        joined_at: new Date()
                    }
                }
            }
        });
    }

    async addMember(workspaceId, data) {
        return prisma.workspaceMember.create({
            data: {
                workspace_id: workspaceId,
                ...data
            }
        });
    }

    async findMember(workspaceId, email) {
        return prisma.workspaceMember.findUnique({
            where: {
                workspace_id_email: { workspace_id: workspaceId, email }
            }
        });
    }

    async findPendingByEmail(email) {
        return prisma.workspaceMember.findMany({
            where: {
                email: email,
                status: 'PENDING'
            }
        });
    }

    async activateMember(memberId, userId) {
        return prisma.workspaceMember.update({
            where: { id: memberId },
            data: {
                status: 'ACTIVE',
                user_id: userId,
                joined_at: new Date()
            }
        });
    }
}
