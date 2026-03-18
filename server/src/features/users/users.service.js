import { UsersRepository } from './users.repository.js';
import { sanitizeUser } from '../../utils/sanitize-user.js';

export class UsersService {
    constructor() {
        this.repository = new UsersRepository();
    }

    async getProfile(userId) {
        const user = await this.repository.findById(userId);
        return sanitizeUser(user);
    }

    async updateProfile(userId, data) {
        const user = await this.repository.update(userId, data);
        return sanitizeUser(user);
    }

    async updatePreferences(userId, newPreferences) {
        const user = await this.repository.findById(userId);
        if (!user) throw new Error('User not found');

        const currentPreferences = user.preferences || {};
        const updatedPreferences = {
            ...currentPreferences,
            ...newPreferences
        };

        const updated = await this.repository.update(userId, {
            preferences: updatedPreferences
        });
        return sanitizeUser(updated);
    }
}
