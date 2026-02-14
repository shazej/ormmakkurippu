import { SettingsService } from './settings.service.js';
import { errorResponse } from '../../utils/errors.js';
import { z } from 'zod';

const service = new SettingsService();

export class SettingsController {

    // Preferences
    async getPreferences(req, res) {
        try {
            const result = await service.getPreferences(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async updatePreferences(req, res) {
        try {
            // Allow any JSON object for preferences
            const result = await service.updatePreferences(req.user, req.body);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    // Notifications
    async getNotifications(req, res) {
        try {
            const result = await service.getNotificationSettings(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async updateNotifications(req, res) {
        try {
            const schema = z.object({
                new_signin_alert: z.boolean().optional(),
                third_party_access_alert: z.boolean().optional(),
                newsletter_subscription: z.boolean().optional()
            });
            const data = schema.parse(req.body);
            const result = await service.updateNotificationSettings(req.user, data);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async updateMarketingMobile(req, res) {
        try {
            const schema = z.object({ mobile: z.string().nullable() });
            const { mobile } = schema.parse(req.body);
            const result = await service.updateMarketingMobile(req.user, mobile);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    // Authorized Websites
    async listAuthorizedWebsites(req, res) {
        try {
            const result = await service.listAuthorizedWebsites(req.user);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }

    async revokeAuthorizedWebsite(req, res) {
        try {
            const { id } = req.params;
            const result = await service.revokeAuthorizedWebsite(req.user, id);
            res.json(result);
        } catch (error) { errorResponse(res, error); }
    }
}
