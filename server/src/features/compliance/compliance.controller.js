import { ComplianceService } from './compliance.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export class ComplianceController {
    constructor() {
        this.service = new ComplianceService();
    }

    async create(req, res) {
        try {
            const cert = await this.service.createCertification(req.body, req.user);
            sendSuccess(res, cert, 'Certification created', 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAll(req, res) {
        try {
            const { region, includeInactive } = req.query;
            const certs = await this.service.getAllCertifications({ region, includeInactive: includeInactive === 'true' });
            sendSuccess(res, certs);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getOne(req, res) {
        try {
            const cert = await this.service.getCertification(req.params.id);
            sendSuccess(res, cert);
        } catch (error) {
            sendError(res, error);
        }
    }

    async update(req, res) {
        try {
            const cert = await this.service.updateCertification(req.params.id, req.body, req.user);
            sendSuccess(res, cert);
        } catch (error) {
            sendError(res, error);
        }
    }

    async delete(req, res) {
        try {
            await this.service.deleteCertification(req.params.id, req.user);
            sendSuccess(res, { message: 'Certification deleted' });
        } catch (error) {
            sendError(res, error);
        }
    }
}
