import { LabelsRepository } from './labels.repository.js';
import { AppError } from '../../utils/app-error.js';

export class LabelsService {
    constructor() {
        this.repository = new LabelsRepository();
    }

    async getLabels(user, search = '') {
        return this.repository.findByOwner(user.uid, search);
    }

    async createLabel(user, { name, color }) {
        if (!name || !name.trim()) {
            throw new AppError('Label name is required', 400);
        }
        if (name.trim().length > 50) {
            throw new AppError('Label name must be 50 characters or fewer', 400);
        }
        if (color && !/^#[0-9a-fA-F]{3,6}$/.test(color)) {
            throw new AppError('Color must be a valid hex code (e.g. #4A90E2)', 400);
        }

        try {
            return await this.repository.create(user.uid, name, color || null);
        } catch (err) {
            if (err.code === 'P2002') {
                // Prisma unique constraint violation
                throw new AppError('A label with that name already exists', 409);
            }
            throw err;
        }
    }
}
