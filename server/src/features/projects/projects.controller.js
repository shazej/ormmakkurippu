import { ProjectsService } from './projects.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

const createSchema = z.object({
    workspaceId: z.string().min(1, 'workspaceId is required'),
    name: z.string().min(1, 'Project name is required').max(100, 'Project name must be 100 characters or fewer'),
    color: z.string().optional().nullable()
});

const updateSchema = z.object({
    name: z.string().min(1, 'Project name cannot be empty').max(100, 'Project name must be 100 characters or fewer').optional(),
    color: z.string().nullable().optional()
}).refine(data => data.name !== undefined || data.color !== undefined, {
    message: 'Provide at least one of: name, color'
});

export class ProjectsController {
    constructor() {
        this.service = new ProjectsService();
    }

    listProjects = async (req, res, next) => {
        try {
            const { workspaceId, includeArchived } = req.query;
            if (!workspaceId) return res.status(400).json({ success: false, error: 'workspaceId query param is required' });
            const projects = await this.service.getProjects(req.user, workspaceId, {
                includeArchived: includeArchived === 'true'
            });
            sendSuccess(res, projects);
        } catch (err) {
            next(err);
        }
    };

    createProject = async (req, res, next) => {
        try {
            const result = createSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error.errors[0]?.message || 'Validation failed',
                    details: result.error.errors
                });
            }
            const project = await this.service.createProject(req.user, result.data);
            sendSuccess(res, project, 'Project created successfully', 201);
        } catch (err) {
            next(err);
        }
    };

    updateProject = async (req, res, next) => {
        try {
            const result = updateSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error.errors[0]?.message || 'Validation failed',
                    details: result.error.errors
                });
            }
            const project = await this.service.updateProject(req.user, req.params.id, result.data);
            sendSuccess(res, project, 'Project updated successfully');
        } catch (err) {
            next(err);
        }
    };

    archiveProject = async (req, res, next) => {
        try {
            const project = await this.service.archiveProject(req.user, req.params.id);
            sendSuccess(res, project, 'Project archived');
        } catch (err) {
            next(err);
        }
    };

    unarchiveProject = async (req, res, next) => {
        try {
            const project = await this.service.unarchiveProject(req.user, req.params.id);
            sendSuccess(res, project, 'Project restored');
        } catch (err) {
            next(err);
        }
    };
}
