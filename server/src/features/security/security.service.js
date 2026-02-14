import { SessionsRepository, AllowedIpsRepository, GeofenceRepository, AppPasswordsRepository } from './security.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logAudit } from '../../admin/audit.js';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';
import { ipToLong, isIpInCidr, isIpBlocked } from '../../utils/ip-utils.js';
import argon2 from 'argon2';
import crypto from 'crypto';

const sessionRepo = new SessionsRepository();
const allowedIpsRepo = new AllowedIpsRepository();
const geofenceRepo = new GeofenceRepository();
const appPasswordsRepo = new AppPasswordsRepository();
const usersRepo = new UsersRepository();

export class SecurityService {

    // --- Sessions ---

    async createSession(user, req) {
        const ua = new UAParser(req.headers['user-agent']);
        const ip = req.ip || req.connection.remoteAddress;
        const geo = geoip.lookup(ip);

        const session = await sessionRepo.create({
            user_id: user.uid,
            user_agent: ua.getUA(),
            ip: ip,
            country: geo ? geo.country : 'Unknown',
            city: geo ? geo.city : 'Unknown',
            device_label: `${ua.getBrowser().name || 'Unknown'} on ${ua.getOS().name || 'Unknown'}`,
            last_seen_at: new Date().toISOString()
        });

        return session;
    }

    async listSessions(user) {
        return sessionRepo.findByUserId(user.uid);
    }

    async revokeSession(user, sessionId) {
        const session = await sessionRepo.findById(sessionId);
        if (!session) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Session not found');
        if (session.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        await sessionRepo.revoke(sessionId);
        await logAudit(user, 'REVOKE_SESSION', 'session', sessionId, { ip: session.ip });
        return { success: true };
    }

    async revokeOtherSessions(user, currentSessionId) {
        await sessionRepo.revokeAllForUser(user.uid, currentSessionId);
        await logAudit(user, 'REVOKE_SESSION', 'session', 'others', { currentSessionId });
        return { success: true };
    }

    // --- Allowed IPs ---

    async listAllowedIps(user) {
        return allowedIpsRepo.findByUserId(user.uid);
    }

    async addAllowedIp(user, { cidr, label }) {
        // Validate CIDR format?
        const newIp = await allowedIpsRepo.create({
            user_id: user.uid,
            cidr,
            label
        });
        await logAudit(user, 'ADD_ALLOWED_IP', 'allowed_ip', newIp.id, { cidr });
        return newIp;
    }

    async removeAllowedIp(user, id) {
        const record = await allowedIpsRepo.findById(id);
        if (!record) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'IP record not found');
        if (record.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        await allowedIpsRepo.delete(id);
        await logAudit(user, 'REMOVE_ALLOWED_IP', 'allowed_ip', id, { cidr: record.cidr });
        return { success: true };
    }

    // --- Geofence ---

    async getGeofence(user) {
        let geofence = await geofenceRepo.findByUserId(user.uid);
        if (!geofence) {
            geofence = { enabled: false, allowed_countries: [] };
        }
        return geofence;
    }

    async updateGeofence(user, { enabled, allowed_countries }) {
        await geofenceRepo.upsert(user.uid, { enabled, allowed_countries });
        const action = enabled ? 'ENABLE_GEOFENCE' : (enabled === false ? 'DISABLE_GEOFENCE' : 'UPDATE_GEOFENCE_COUNTRIES');
        await logAudit(user, action, 'geofence', user.uid, { allowed_countries });
        return { success: true };
    }


    // --- Passwords ---

    async changePassword(user, currentPassword, newPassword) {
        // Fetch full user record to get hash
        const userRecord = await usersRepo.findById(user.uid);
        if (!userRecord) {
            // If user doesn't exist in our DB (only in Auth), we might need to create or fail.
            // Given requirement "extend existing Users", we assume they exist.
            throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'User profile not found');
        }

        if (userRecord.password_hash) {
            const valid = await argon2.verify(userRecord.password_hash, currentPassword);
            if (!valid) {
                throw new AppError(ErrorCodes.OLD_PASSWORD_INCORRECT, 'Current password is incorrect');
            }
        } else {
            // If no password set, maybe allow setting it if we consider this "Set Password" too?
            // But endpoint is "change-password" and takes "current_password".
            // If current_password is provided effectively but user has none, logic fails.
            // We can skip check if user has NO password? 
            // "Change password {current_password, new_password}".
            // Let's strict check: if password_hash exists, verify. If not, maybe allow?
            // For safety, let's assume if they have no password, they can't "Change" it via this flow, 
            // maybe they use "Forgot Password" or "Set Password".
            // Or we imply if they login via Google, they might not have a password. 
            // Let's enforce current password only if one is set.
            if (currentPassword) {
                // User provided a current password but has none stored? Invalid.
                throw new AppError(ErrorCodes.OLD_PASSWORD_INCORRECT, 'User has no password set');
            }
        }

        // Check new password strength (minimal check)
        if (newPassword.length < 8) {
            throw new AppError(ErrorCodes.PASSWORD_TOO_WEAK, 'Password must be at least 8 characters');
        }

        const newHash = await argon2.hash(newPassword);

        await usersRepo.update(user.uid, {
            password_hash: newHash,
            password_updated_at: new Date().toISOString()
        });

        await logAudit(user, 'CHANGE_PASSWORD', 'user', user.uid, {});

        // Revoke all other sessions? Optional but good practice.
        // await this.revokeOtherSessions(user, null);

        return { success: true };
    }

    // --- App Passwords ---

    async listAppPasswords(user) {
        return appPasswordsRepo.findByUserId(user.uid);
    }

    async generateAppPassword(user, name) {
        // Limit number of app passwords?
        const current = await this.listAppPasswords(user);
        if (current.length >= 20) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Limit of 20 app passwords reached');
        }

        // Generate strong random password (e.g. 4 blocks of 4 chars)
        const raw = crypto.randomBytes(12).toString('hex'); // 24 chars
        // Format for readability: xxxx-xxxx-xxxx-xxxx
        const passwordPlain = raw.match(/.{1,4}/g).join('-');

        const hash = await argon2.hash(passwordPlain);

        const appPasword = await appPasswordsRepo.create({
            user_id: user.uid,
            name,
            password_hash: hash,
            last_used_at: null
        });

        await logAudit(user, 'GENERATE_APP_PASSWORD', 'app_password', appPasword.id, { name });

        return {
            id: appPasword.id,
            name: appPasword.name,
            password_plaintext_once: passwordPlain
        };
    }

    async revokeAppPassword(user, id) {
        const record = await appPasswordsRepo.findById(id);
        if (!record) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'App password not found');
        if (record.user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        await appPasswordsRepo.delete(id); // Or revoke (soft delete)
        await logAudit(user, 'REVOKE_APP_PASSWORD', 'app_password', id, { name: record.name });

        return { success: true };
    }

    // --- Policy Checks (Used in Middleware/Login) ---

    async checkLoginPolicy(user, req) {
        const ip = req.ip || req.connection.remoteAddress;
        const geo = geoip.lookup(ip);
        const country = geo ? geo.country : 'Unknown';

        // 1. Check Geofence
        const geofence = await geofenceRepo.findByUserId(user.uid);
        if (geofence && geofence.enabled) {
            if (!geofence.allowed_countries.includes(country)) {
                throw new AppError(ErrorCodes.GEOFENCE_BLOCK, 'Login blocked by Geofence policy', 403, { country });
            }
        }

        // 2. Check Allowed IPs
        const allowedIps = await allowedIpsRepo.findByUserId(user.uid);
        if (allowedIps && allowedIps.length > 0) {
            const isAllowed = allowedIps.some(record => isIpInCidr(ip, record.cidr));
            if (!isAllowed) {
                throw new AppError(ErrorCodes.IP_NOT_ALLOWED, 'Login blocked by IP Allowlist', 403, { ip });
            }
        }
    }

}
