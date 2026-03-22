/**
 * Email notification service.
 *
 * Supports configurable email providers via env vars:
 *   EMAIL_NOTIFICATIONS_ENABLED=true
 *   EMAIL_PROVIDER=console|sendgrid|smtp
 *   EMAIL_API_KEY=...
 *   EMAIL_FROM=noreply@example.com
 *
 * When not configured, fails gracefully and logs the notification
 * that would have been sent (useful for local dev).
 */
export class EmailNotificationService {
    constructor() {
        this.enabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';
        this.provider = process.env.EMAIL_PROVIDER || 'console';
        this.from = process.env.EMAIL_FROM || 'noreply@ormmakkurippu.app';
    }

    /**
     * Send an email. Returns silently if email is disabled.
     */
    async send({ to, subject, body, type }) {
        if (!this.enabled) {
            console.log(`[EmailNotification] Disabled. Would send to=${to} subject="${subject}"`);
            return { sent: false, reason: 'email_disabled' };
        }

        if (!to) {
            console.warn('[EmailNotification] No recipient email provided. Skipping.');
            return { sent: false, reason: 'no_recipient' };
        }

        try {
            if (this.provider === 'console') {
                // Dev/local mode: log to console instead of sending
                console.log(`[EmailNotification] [CONSOLE MODE]`);
                console.log(`  To: ${to}`);
                console.log(`  From: ${this.from}`);
                console.log(`  Subject: ${subject}`);
                console.log(`  Body: ${body}`);
                console.log(`  Type: ${type}`);
                return { sent: true, provider: 'console' };
            }

            if (this.provider === 'sendgrid') {
                return this._sendViaSendgrid({ to, subject, body });
            }

            console.warn(`[EmailNotification] Unknown provider "${this.provider}". Email not sent.`);
            return { sent: false, reason: 'unknown_provider' };
        } catch (err) {
            console.error(`[EmailNotification] Failed to send email to ${to}:`, err.message);
            return { sent: false, reason: 'send_error', error: err.message };
        }
    }

    /**
     * SendGrid integration stub.
     * Implement when EMAIL_PROVIDER=sendgrid and EMAIL_API_KEY is set.
     */
    async _sendViaSendgrid({ to, subject, body }) {
        const apiKey = process.env.EMAIL_API_KEY;
        if (!apiKey) {
            console.error('[EmailNotification] EMAIL_API_KEY not set for sendgrid provider.');
            return { sent: false, reason: 'missing_api_key' };
        }

        // Dynamic import to avoid requiring the package if not used
        try {
            const sgMail = (await import('@sendgrid/mail')).default;
            sgMail.setApiKey(apiKey);

            await sgMail.send({
                to,
                from: this.from,
                subject,
                text: body,
                html: this._buildHtmlTemplate(subject, body),
            });

            console.log(`[EmailNotification] Sent via SendGrid to ${to}`);
            return { sent: true, provider: 'sendgrid' };
        } catch (err) {
            console.error('[EmailNotification] SendGrid error:', err.message);
            return { sent: false, reason: 'sendgrid_error', error: err.message };
        }
    }

    _escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    _buildHtmlTemplate(subject, body) {
        const safeSubject = this._escapeHtml(subject);
        const safeBody = this._escapeHtml(body);
        return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="border-bottom: 2px solid #dc2626; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #111;"><span style="color: #dc2626;">ormmak</span>kurippu</h2>
  </div>
  <h3 style="margin: 0 0 8px 0; color: #111;">${safeSubject}</h3>
  <p style="margin: 0 0 20px 0; line-height: 1.6; color: #555;">${safeBody}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">You received this because of your notification preferences. You can update them in Settings.</p>
</body>
</html>`;
    }
}
