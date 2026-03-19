import { UsersRepository } from './users.repository.js';

export class UsersService {
    constructor() {
        this.repository = new UsersRepository();
    }

    async getProfile(userId) {
        const user = await this.repository.findById(userId);
        if (!user) return null;

        // Sanitize: Remove sensitive fields before returning to client
        const { password_hash, verification_token_hash, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    async updateProfile(userId, data) {
        const user = await this.repository.update(userId, data);
        const { password_hash, verification_token_hash, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    async updatePreferences(userId, newPreferences) {
        const existingUser = await this.repository.findById(userId);
        if (!existingUser) throw new Error('User not found');

        // Merge existing preferences with new ones
        const currentPreferences = existingUser.preferences || {};
        const updatedPreferences = {
            ...currentPreferences,
            ...newPreferences
        };

        const updatedUser = await this.repository.update(userId, {
            preferences: updatedPreferences
        });

        const { password_hash, verification_token_hash, ...sanitizedUser } = updatedUser;
        return sanitizedUser;
    }
}
