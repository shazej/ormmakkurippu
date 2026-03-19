import { ProjectsRepository } from './projects.repository.js';
import { AppError } from '../../utils/app-error.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectsService {
    constructor() {
        this.repository = new ProjectsRepository();
    }

    /**
     * Verifies the requesting user is an ACTIVE member of the given workspace.
     * Throws 404 if workspace not found, 403 if not a member.
     */
    async _assertMembership(userId, workspaceId) {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { id: true }
        });
        if (!workspace) throw new AppError('Workspace not found', 404);

        const member = await prisma.workspaceMember.findFirst({
            where: { workspace_id: workspaceId, user_id: userId, status: 'ACTIVE' }
        });
        if (!member) throw new AppError('Forbidden: you are not a member of this workspace', 403);
    }

    /**
     * Verifies the requesting user is a member of the workspace that owns the project.
     * Returns the project (throws 404 if not found).
     */
    async _assertProjectAccess(userId, projectId) {
        const project = await this.repository.findById(projectId);
        if (!project) throw new AppError('Project not found', 404);
        await this._assertMembership(userId, project.workspace_id);
        return project;
    }

    async getProjects(user, workspaceId, { includeArchived = false } = {}) {
        await this._assertMembership(user.uid, workspaceId);
        return this.repository.findByWorkspaceId(workspaceId, { includeArchived });
    }

    async createProject(user, { workspaceId, name, color }) {
        if (!workspaceId) throw new AppError('workspaceId is required', 400);

        const trimmedName = (name || '').trim();
        if (!trimmedName) throw new AppError('Project name is required', 400);
        if (trimmedName.length > 100) throw new AppError('Project name must be 100 characters or fewer', 400);

        await this._assertMembership(user.uid, workspaceId);

        return this.repository.create({
            workspaceId,
            name: trimmedName,
            color: color || null,
            createdByUserId: user.uid
        });
    }

    async updateProject(user, projectId, { name, color }) {
        await this._assertProjectAccess(user.uid, projectId);

        const updates = {};
        if (name !== undefined) {
            const trimmedName = name.trim();
            if (!trimmedName) throw new AppError('Project name cannot be empty', 400);
            if (trimmedName.length > 100) throw new AppError('Project name must be 100 characters or fewer', 400);
            updates.name = trimmedName;
        }
        if (color !== undefined) updates.color = color;

        if (Object.keys(updates).length === 0) throw new AppError('Nothing to update', 400);

        return this.repository.update(projectId, updates);
    }

    async archiveProject(user, projectId) {
        await this._assertProjectAccess(user.uid, projectId);
        return this.repository.archive(projectId);
    }

    async unarchiveProject(user, projectId) {
        await this._assertProjectAccess(user.uid, projectId);
        return this.repository.unarchive(projectId);
    }
}
