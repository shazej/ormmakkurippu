import { WorkspacesRepository } from './workspaces.repository.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Need for direct user query if needed

export class WorkspacesService {
    constructor() {
        this.repository = new WorkspacesRepository();
    }

    async getMyWorkspaces(user) {
        return this.repository.findByUserId(user.uid);
    }

    async createWorkspace(user, name) {
        // Fetch user email to store in member record (schema requirement)
        const userData = await prisma.user.findUnique({ where: { id: user.uid } });
        const ownerEmail = userData?.primary_email_id || `${user.uid}@placeholder`;

        // We need to pass the email to repository or handle it there. 
        // Let's adjust repository create calls or do Prisma transaction here.
        // Actually repository logic above used placeholder. Let's fix it by passing email.

        return prisma.workspace.create({
            data: {
                name,
                owner_user_id: user.uid,
                members: {
                    create: {
                        user_id: user.uid,
                        email: ownerEmail,
                        role: 'OWNER',
                        status: 'ACTIVE',
                        joined_at: new Date()
                    }
                }
            }
        });
    }

    async inviteMember(user, workspaceId, email, role = 'MEMBER') {
        const workspace = await this.repository.findById(workspaceId);
        if (!workspace) throw new Error('Workspace not found');

        if (workspace.owner_user_id !== user.uid) {
            throw new Error('Only workspace owner can invite members');
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingMember = await this.repository.findMember(workspaceId, normalizedEmail);
        if (existingMember) {
            return { email: normalizedEmail, status: 'ALREADY_MEMBER' };
        }

        const existingUser = await prisma.user.findUnique({
            where: { primary_email_id: normalizedEmail }
        });

        if (existingUser) {
            await prisma.$transaction([
                prisma.workspaceMember.create({
                    data: {
                        workspace_id: workspaceId,
                        user_id: existingUser.id,
                        email: normalizedEmail,
                        role,
                        status: 'ACTIVE',
                        joined_at: new Date()
                    }
                }),
                prisma.workspaceInvite.create({
                    data: {
                        workspace_id: workspaceId,
                        email: normalizedEmail,
                        invited_by_user_id: user.uid,
                        status: 'ACCEPTED'
                    }
                })
            ]);
            return { email: normalizedEmail, status: 'ADDED', role };
        } else {
            await prisma.$transaction([
                prisma.workspaceMember.create({
                    data: {
                        workspace_id: workspaceId,
                        email: normalizedEmail,
                        role,
                        status: 'PENDING'
                    }
                }),
                prisma.workspaceInvite.create({
                    data: {
                        workspace_id: workspaceId,
                        email: normalizedEmail,
                        invited_by_user_id: user.uid,
                        status: 'PENDING'
                    }
                })
            ]);
            return { email: normalizedEmail, status: 'INVITED', role };
        }
    }

    async updateWorkspace(user, workspaceId, data) {
        const workspace = await this.repository.findById(workspaceId);
        if (!workspace) throw new Error('Workspace not found');

        if (workspace.owner_user_id !== user.uid) {
            throw new Error('Only workspace owner can update workspace settings');
        }

        return prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: data.name },
        });
    }

    // Auto-create default workspace if user has none
    async ensureDefaultWorkspace(userId, email) {
        const workspaces = await this.repository.findByUserId(userId);
        if (workspaces.length === 0) {
            console.log(`[Workspaces] Creating default workspace for ${email}`);
            const workspace = await prisma.workspace.create({
                data: {
                    name: "My Workspace",
                    owner_user_id: userId,
                    members: {
                        create: {
                            user_id: userId,
                            email: email,
                            role: 'OWNER',
                            status: 'ACTIVE',
                            joined_at: new Date()
                        }
                    }
                }
            });
            // Set as default
            await prisma.user.update({
                where: { id: userId },
                data: { default_workspace_id: workspace.id }
            });
        }
    }

    // Auto-accept pending invites on login
    async acceptPendingInvites(user, email) {
        if (!email) return;

        const pendingInvites = await this.repository.findPendingByEmail(email);
        if (pendingInvites.length === 0) return;

        console.log(`[Workspaces] Found ${pendingInvites.length} pending invites for ${email}`);

        for (const invite of pendingInvites) {
            try {
                await this.repository.activateMember(invite.id, user.id);
                console.log(`[Workspaces] Auto-accepted invite for workspace ${invite.workspace_id}`);
            } catch (error) {
                console.error(`[Workspaces] Failed to auto-accept invite ${invite.id}:`, error.message);
            }
        }
    }

    async getCurrentWorkspace(user) {
        // 1. Try default workspace from user preference
        const defaultWorkspaceId = user._dbUser?.default_workspace_id;

        if (defaultWorkspaceId) {
            const workspace = await this.repository.findById(defaultWorkspaceId);
            // Check if still a member and active
            const membership = workspace?.members.find(m => m.user_id === user.uid && m.status === 'ACTIVE');
            if (workspace && membership) {
                return workspace;
            }
        }

        // 2. Fallback: Get first active workspace
        const workspaces = await this.repository.findByUserId(user.uid);
        if (workspaces.length > 0) {
            // Update default for next time
            await prisma.user.update({
                where: { id: user.uid },
                data: { default_workspace_id: workspaces[0].id }
            });
            return workspaces[0];
        }

        return null;
    }
}
