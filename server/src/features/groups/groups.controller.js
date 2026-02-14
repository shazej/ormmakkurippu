import { GroupsService } from './groups.service.js';
import { errorResponse } from '../../utils/errors.js';
import { z } from 'zod';

const service = new GroupsService();

export class GroupsController {

    async list(req, res) {
        try {
            const result = await service.listGroups(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async create(req, res) {
        try {
            const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
            const result = await service.createGroup(req.user, name);
            res.status(201).json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async update(req, res) {
        try {
            const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
            const result = await service.updateGroup(req.user, req.params.id, name);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async delete(req, res) {
        try {
            const result = await service.deleteGroup(req.user, req.params.id);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async listMembers(req, res) {
        try {
            const result = await service.listMembers(req.user, req.params.id);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async addMember(req, res) {
        try {
            const { email } = z.object({ email: z.string().email() }).parse(req.body);
            const result = await service.addMember(req.user, req.params.id, email);
            res.status(201).json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async removeMember(req, res) {
        try {
            const result = await service.removeMember(req.user, req.params.id, req.params.memberId);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }
}
