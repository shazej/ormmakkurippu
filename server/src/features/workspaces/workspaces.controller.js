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
    };

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
    };

    inviteMember = async (req, res) => {
        try {
            const schema = z.object({
                emails: z.array(z.string().email()).min(1)
            });
            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            const { id } = req.params; // workspaceId
            const results = await this.service.inviteMember(req.user, id, result.data.emails);
            sendSuccess(res, results, 'Invites processed');
        } catch (error) {
            sendError(res, error);
        }
    };

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
    };

    updateCurrentWorkspace = async (req, res) => {
        try {
            const schema = z.object({
                name: z.string().min(1)
            });
            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            const currentWorkspace = await this.service.getCurrentWorkspace(req.user);
            if (!currentWorkspace) return sendError(res, 'No active workspace found', 404);

            const updated = await this.service.updateWorkspace(req.user, currentWorkspace.id, result.data);
            sendSuccess(res, updated, 'Workspace renamed');
        } catch (error) {
            sendError(res, error.message, error.status || 500);
        }
    };

    removeMember = async (req, res) => {
        try {
            const { userId } = req.params;
            const currentWorkspace = await this.service.getCurrentWorkspace(req.user);
            if (!currentWorkspace) return sendError(res, 'No active workspace found', 404);

            await this.service.removeMember(req.user, currentWorkspace.id, userId);
            sendSuccess(res, null, 'Member removed');
        } catch (error) {
            sendError(res, error.message, error.status || 500);
        }
    };
}
