import { ComplianceRepository } from './compliance.repository.js';
import { AppError } from '../../utils/app-error.js';

export class ComplianceService {
    constructor() {
        this.repository = new ComplianceRepository();
    }

    async createCertification(data, adminUser) {
        if (!data.name || !data.standard) {
            throw new AppError('Name and Standard are required', 400);
        }
        // TODO: Validate dates?
        return await this.repository.create(data);
    }

    async getAllCertifications(filters) {
        return await this.repository.findAll(filters);
    }

    async getCertification(id) {
        const cert = await this.repository.findById(id);
        if (!cert) throw new AppError('Certification not found', 404);
        return cert;
    }

    async updateCertification(id, data, adminUser) {
        const existing = await this.getCertification(id);
        if (!existing) throw new AppError('Certification not found', 404);

        return await this.repository.update(id, data);
    }

    async deleteCertification(id, adminUser) {
        const existing = await this.getCertification(id);
        if (!existing) throw new AppError('Certification not found', 404);

        return await this.repository.delete(id);
    }
}
