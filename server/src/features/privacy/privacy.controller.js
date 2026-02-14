import { PrivacyService } from './privacy.service.js';
import { errorResponse } from '../../utils/errors.js';
import { z } from 'zod';

const service = new PrivacyService();

export class PrivacyController {

    // Stub Org ID extraction (Mock: use 'default-org')
    getOrgId(req) {
        return req.query.org_id || 'default-org';
    }

    async getDpa(req, res) {
        try {
            const orgId = this.getOrgId(req);
            const result = await service.getDpaStatus(req.user, orgId);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async initiateDpa(req, res) {
        try {
            const orgId = this.getOrgId(req); // Or from body
            const result = await service.initiateDpa(req.user, orgId);
            res.status(201).json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async revokeDpa(req, res) {
        try {
            const { id } = req.params; // DPA ID
            const result = await service.revokeDpa(req.user, id);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async listContacts(req, res) {
        try {
            const orgId = this.getOrgId(req);
            const result = await service.listContacts(req.user, orgId);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async addContact(req, res) {
        try {
            const orgId = this.getOrgId(req);
            const schema = z.object({
                name: z.string().min(1),
                email: z.string().email(),
                role: z.string().optional()
            });
            const data = schema.parse(req.body);
            const result = await service.addContact(req.user, orgId, data);
            res.status(201).json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async updateContact(req, res) {
        try {
            const result = await service.updateContact(req.user, req.params.id, req.body);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async deleteContact(req, res) {
        try {
            const result = await service.deleteContact(req.user, req.params.id);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }
}
