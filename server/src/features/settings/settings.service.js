import { NotificationSettingsRepository, OAuthConsentsRepository } from './settings.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logAudit } from '../../admin/audit.js';

const notificationRepo = new NotificationSettingsRepository();
const consentsRepo = new OAuthConsentsRepository();
const usersRepo = new UsersRepository();

export class SettingsService {

    // --- Preferences ---

    async getPreferences(user) {
        const userRecord = await usersRepo.findById(user.uid);
        return userRecord?.preferences || {};
    }

    async updatePreferences(user, preferences) {
        // Merge with existing
        const current = await this.getPreferences(user);
        const updated = { ...current, ...preferences };

        await usersRepo.update(user.uid, { preferences: updated });
        await logAudit(user, 'UPDATE_PREFERENCES', 'user', user.uid, { keys: Object.keys(preferences) });
        return updated;
    }

    // --- Notifications ---

    async getNotificationSettings(user) {
        const settings = await notificationRepo.findByUserId(user.uid);
        // Default values
        return settings || {
            new_signin_alert: true,
            third_party_access_alert: true,
            newsletter_subscription: false
        };
    }

    async updateNotificationSettings(user, settings) {
        const result = await notificationRepo.upsert(user.uid, settings);
        await logAudit(user, 'UPDATE_NOTIFICATION_SETTINGS', 'notification_settings', result.id, {});
        return result;
    }

    async updateMarketingMobile(user, mobile) {
        await usersRepo.update(user.uid, { marketing_mobile: mobile });
        await logAudit(user, 'UPDATE_MARKETING_MOBILE', 'user', user.uid, {});
        return { success: true };
    }

    // --- Authorized Websites ---

    async listAuthorizedWebsites(user) {
        return consentsRepo.findByUserId(user.uid);
    }

    async revokeAuthorizedWebsite(user, id) {
        const consent = await consentsRepo.findById(id);
        if (!consent) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Consent not found');
        if (consent.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        await consentsRepo.delete(id);
        await logAudit(user, 'REVOKE_OAUTH_CONSENT', 'oauth_consent', id, { client: consent.client_name });
        return { success: true };
    }
}
