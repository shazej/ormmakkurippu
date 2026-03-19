import { UsersService } from './users.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

export class UsersController {
    constructor() {
        this.service = new UsersService();
    }

    getProfile = async (req, res) => {
        try {
            // req.user is already populated by auth middleware, but we might want fresh data
            const user = await this.service.getProfile(req.user.uid);
            sendSuccess(res, user);
        } catch (error) {
            sendError(res, error);
        }
    };

    updateProfile = async (req, res) => {
        try {
            const schema = z.object({
                display_name: z.string().min(1).optional(),
                avatar_url: z.string().url().optional().or(z.literal('')),
                use_case: z.enum(['myself', 'team']).optional(),
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            const updatedUser = await this.service.updateProfile(req.user.uid, result.data);
            sendSuccess(res, updatedUser, 'Profile updated');
        } catch (error) {
            sendError(res, error);
        }
    };

    updatePreferences = async (req, res) => {
        try {
            const schema = z.object({
                shareCallerDetails: z.boolean().optional(),
                // Add other preferences here as needed
            });

            const result = schema.safeParse(req.body);
            if (!result.success) return sendError(res, result.error.errors, 400);

            const updatedUser = await this.service.updatePreferences(req.user.uid, result.data);
            sendSuccess(res, updatedUser.preferences, 'Preferences updated');
        } catch (error) {
            sendError(res, error);
        }
    };
}
