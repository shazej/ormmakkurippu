import { SecurityService } from './security.service.js';
import { errorResponse } from '../../utils/errors.js';
import { z } from 'zod';

const securityService = new SecurityService();

export class SecurityController {
    // --- Sessions ---

    async getSessions(req, res) {
        try {
            const sessions = await securityService.listSessions(req.user);
            // Mark current session
            const currentToken = req.headers.authorization?.split(' ')[1] || req.cookies.session;
            // This detection of "current" is tricky without storing token hash in session or having session ID in token.
            // For MVP, we might just return them all.
            // If we had session ID in req.user (from auth middleware), we could mark it.
            res.json(sessions);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async revokeSession(req, res) {
        try {
            const { id } = req.params;
            const result = await securityService.revokeSession(req.user, id);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async revokeOtherSessions(req, res) {
        try {
            // We need current session ID to exclude it.
            // For now, we might revoke ALL if we can't identify current.
            // Or we assume the client sends "current_session_id" in body? No, security risk.
            // We need to upgrade Auth Middleware to attach sessionId to req.user if available.
            // For now, let's stub "exceptSessionId" as null (revokes all including current one, forcing re-login, which is safe).
            const result = await securityService.revokeOtherSessions(req.user, null);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    // --- Allowed IPs ---

    async getAllowedIps(req, res) {
        try {
            const ips = await securityService.listAllowedIps(req.user);
            res.json(ips);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async addAllowedIp(req, res) {
        try {
            const schema = z.object({ cidr: z.string(), label: z.string().optional() });
            const data = schema.parse(req.body);
            const result = await securityService.addAllowedIp(req.user, data);
            res.status(201).json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async removeAllowedIp(req, res) {
        try {
            const { id } = req.params;
            const result = await securityService.removeAllowedIp(req.user, id);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    // --- Geofence ---

    async getGeofence(req, res) {
        try {
            const result = await securityService.getGeofence(req.user);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async updateGeofence(req, res) {
        try {
            const schema = z.object({
                enabled: z.boolean(),
                allowed_countries: z.array(z.string().length(2))
            });
            const data = schema.parse(req.body);
            const result = await securityService.updateGeofence(req.user, data);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    // --- Passwords ---

    async changePassword(req, res) {
        try {
            const schema = z.object({
                current_password: z.string().optional(),
                new_password: z.string().min(8)
            });
            const { current_password, new_password } = schema.parse(req.body);

            const result = await securityService.changePassword(req.user, current_password, new_password);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async getAppPasswords(req, res) {
        try {
            const result = await securityService.listAppPasswords(req.user);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async generateAppPassword(req, res) {
        try {
            const schema = z.object({ name: z.string().min(1) });
            const { name } = schema.parse(req.body);

            const result = await securityService.generateAppPassword(req.user, name);
            res.status(201).json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }

    async revokeAppPassword(req, res) {
        try {
            const { id } = req.params;
            const result = await securityService.revokeAppPassword(req.user, id);
            res.json(result);
        } catch (error) {
            errorResponse(res, error);
        }
    }
}
