import { UsersRepository } from './users.repository.js';

export class UsersService {
    constructor() {
        this.repository = new UsersRepository();
    }

    async getProfile(userId) {
        // ... potentially sanitize or transform
        return this.repository.findById(userId);
    }

    async updateProfile(userId, data) {
        return this.repository.update(userId, data);
    }

    async updatePreferences(userId, newPreferences) {
        const user = await this.repository.findById(userId);
        if (!user) throw new Error('User not found');

        // Merge existing preferences with new ones
        const currentPreferences = user.preferences || {};
        const updatedPreferences = {
            ...currentPreferences,
            ...newPreferences
        };

        return this.repository.update(userId, {
            preferences: updatedPreferences
        });
    }
}
