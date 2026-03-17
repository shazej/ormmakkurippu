import { WorkspacesService } from './workspaces.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

export class WorkspacesController {
    constructor() {
        this.service = new WorkspacesService();
    }

    getWorkspaces = async (req, res) => {
        try {
            const workspaces = await this.service.getMyWorkspaces(req.user);
            sendSuccess(res, workspaces);
        } catch (error) {
            sendError(res, error);
        }
    }

    createWorkspace = async (req, res) => {
        try {
            const schema = z.object({
                name: z.string().min(1)
            });
            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            const workspace = await this.service.createWorkspace(req.user, result.data.name);
            sendSuccess(res, workspace, 'Workspace created', 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    inviteMember = async (req, res) => {
        try {
            const schema = z.object({
                email: z.string().email().toLowerCase().trim(),
                role: z.enum(['ADMIN', 'MEMBER', 'GUEST']).default('MEMBER'),
            });
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const msg = result.error.errors[0]?.message || 'Invalid input.';
                return sendError(res, msg, 400);
            }

            const { id } = req.params;
            const outcome = await this.service.inviteMember(
                req.user, id, result.data.email, result.data.role
            );
            sendSuccess(res, outcome, 'Invite processed');
        } catch (error) {
            sendError(res, error);
        }
    }

    updateWorkspace = async (req, res) => {
        try {
            const schema = z.object({
                name: z.string().min(1).max(100).trim(),
            });
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const msg = result.error.errors[0]?.message || 'Invalid input.';
                return sendError(res, msg, 400);
            }

            const workspace = await this.service.updateWorkspace(
                req.user, req.params.id, result.data
            );
            sendSuccess(res, workspace, 'Workspace updated');
        } catch (error) {
            sendError(res, error);
        }
    }

    getCurrentWorkspace = async (req, res) => {
        try {
            const workspace = await this.service.getCurrentWorkspace(req.user);
            if (!workspace) {
                return sendError(res, 'No active workspace found', 404);
            }
            sendSuccess(res, workspace);
        } catch (error) {
            sendError(res, error);
        }
    }
}
