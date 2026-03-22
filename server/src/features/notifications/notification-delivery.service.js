import { EmailNotificationService } from './email-notification.service.js';

/**
 * Centralized delivery service that dispatches notifications across channels.
 * Currently supports: in-app (handled by repository) and email.
 * Push notifications can be added here in the future.
 */
export class NotificationDeliveryService {
    constructor() {
        this.emailService = new EmailNotificationService();
    }

    /**
     * Send an email notification.
     * @param {object} params
     * @param {string} params.to - Recipient email
     * @param {string} params.subject
     * @param {string} params.body
     * @param {string} params.type - NotificationType for template selection
     */
    async sendEmail({ to, subject, body, type }) {
        return this.emailService.send({ to, subject, body, type });
    }

    /**
     * Future: send push notification.
     * @param {object} params
     */
    async sendPush(params) {
        // Push notifications are planned for a future release.
        // This method exists to make adding push delivery straightforward.
        console.log('[NotificationDelivery] Push not implemented yet. Skipping.');
        return null;
    }
}
