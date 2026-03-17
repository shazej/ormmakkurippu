import { UsersService } from './users.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { z } from 'zod';

export class UsersController {
    constructor() {
        this.service = new UsersService();
    }

    getProfile = async (req, res) => {
        try {
            const user = await this.service.getProfile(req.user.uid);
            if (!user) return sendError(res, 'User not found', 404);
            sendSuccess(res, user);
        } catch (error) {
            sendError(res, error);
        }
    }

    updateProfile = async (req, res) => {
        try {
            const schema = z.object({
                display_name: z.string().min(1).max(100).trim().optional(),
                avatar_url: z.string().url().optional().or(z.literal('')),
                use_case: z.enum(['myself', 'team']).optional(),
                phone: z.string().max(20).optional(),
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                const msg = result.error.errors[0]?.message || 'Invalid input.';
                return sendError(res, msg, 400);
            }

            const updatedUser = await this.service.updateProfile(req.user.uid, result.data);
            sendSuccess(res, updatedUser, 'Profile updated');
        } catch (error) {
            sendError(res, error);
        }
    }

    updatePreferences = async (req, res) => {
        try {
            const schema = z.object({
                shareCallerDetails: z.boolean().optional(),
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                return sendError(res, result.error.errors, 400);
            }

            const updatedUser = await this.service.updatePreferences(req.user.uid, result.data);
            sendSuccess(res, updatedUser.preferences, 'Preferences updated');
        } catch (error) {
            sendError(res, error);
        }
    }
}
