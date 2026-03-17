import { UsersRepository } from './users.repository.js';

export class UsersService {
    constructor() {
        this.repository = new UsersRepository();
    }

    async getProfile(userId) {
        const user = await this.repository.findById(userId);
        if (!user) return null;
        return {
            id: user.id,
            display_name: user.display_name,
            email: user.primary_email_id,
            avatar_url: user.avatar_url,
            role: user.role,
            use_case: user.use_case,
            is_onboarded: user.is_onboarded,
            onboarding_step: user.onboarding_step,
            default_workspace_id: user.default_workspace_id,
            phone: user.marketing_mobile,
        };
    }

    async updateProfile(userId, data) {
        const { phone, ...rest } = data;
        const updateData = { ...rest };
        // phone maps to marketing_mobile in the schema
        if (phone !== undefined) updateData.marketing_mobile = phone;
        const user = await this.repository.update(userId, updateData);
        // Return sanitized shape
        return {
            id: user.id,
            display_name: user.display_name,
            email: user.primary_email_id,
            avatar_url: user.avatar_url,
            role: user.role,
            use_case: user.use_case,
            is_onboarded: user.is_onboarded,
            onboarding_step: user.onboarding_step,
            default_workspace_id: user.default_workspace_id,
            phone: user.marketing_mobile,
        };
    }

    async updatePreferences(userId, newPreferences) {
        const user = await this.repository.findById(userId);
        if (!user) throw new Error('User not found');

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
