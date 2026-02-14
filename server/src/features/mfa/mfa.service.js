import { MfaRepository, WebAuthnRepository } from './mfa.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logAudit } from '../../admin/audit.js';
import { TOTP } from 'otplib';
// Using default options (SHA1, 30s) which is Google Auth standard.
const authenticator = new TOTP();
import qrcode from 'qrcode';

// SimpleWebAuthn setup (minimal)
// import { generateRegistrationOptions, verifyRegistrationResponse, ... } from '@simplewebauthn/server';
// We will stub WebAuthn for now as getting full FIDO2 server working requires domain config and frontend.
// But we will provide the endpoints structure.

const mfaRepo = new MfaRepository();
const webAuthnRepo = new WebAuthnRepository();

export class MfaService {

    async listMethods(user) {
        const methods = await mfaRepo.findByUserId(user.uid);
        const webauthn = await webAuthnRepo.findByUserId(user.uid);
        return {
            totp: methods.filter(m => m.type === 'totp'),
            webauthn,
            is_enabled: methods.some(m => m.status === 'enabled') || webauthn.length > 0
        };
    }

    // --- TOTP ---

    async setupTotp(user) {
        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, 'Ormmakarippu', secret);

        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        // Don't save yet, or save as pending?
        // Usually we verify first.
        // Return secret to frontend to verify.
        // Or store temporarily?
        // Let's return masked secret + QR.

        return { secret, qrCodeUrl };
    }

    async verifyAndEnableTotp(user, secret, token) {
        const isValid = authenticator.verify({ token, secret });
        if (!isValid) {
            throw new AppError(ErrorCodes.INVALID_OTP, 'Invalid OTP code');
        }

        // Check if already enabled
        const existing = await mfaRepo.findByUserId(user.uid);
        if (existing.find(m => m.type === 'totp')) {
            // Maybe update secret?
            const existingTotp = existing.find(m => m.type === 'totp');
            await mfaRepo.update(existingTotp.id, { secret_encrypted: secret, status: 'enabled' });
        } else {
            await mfaRepo.create({
                user_id: user.uid,
                type: 'totp',
                status: 'enabled',
                secret_encrypted: secret // In real app, encrypt this!
            });
        }

        await logAudit(user, 'ENABLE_MFA', 'mfa_method', 'totp', {});
        return { success: true };
    }

    async disableTotp(user, password) {
        // Verify password first (TODO)
        // For MVP, we skip password check or assume middleware did it (Step-Up).

        const existing = await mfaRepo.findByUserId(user.uid);
        const totp = existing.find(m => m.type === 'totp');

        if (totp) {
            await mfaRepo.delete(totp.id);
            await logAudit(user, 'DISABLE_MFA', 'mfa_method', 'totp', {});
        }

        return { success: true };
    }

    // --- WebAuthn (Stubs) ---

    async generateWebAuthnRegistrationOptions(user) {
        // Mock options
        return {
            challenge: 'mock-challenge-base64',
            rp: { name: 'Ormmakarippu', id: 'localhost' },
            user: { id: user.uid, name: user.email, displayName: user.name || user.email },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            timeout: 60000,
            attestation: 'none'
        };
    }

    async verifyWebAuthnRegistration(user, response) {
        // Mock verification
        const credentialID = 'mock-cred-id-' + Date.now();
        await webAuthnRepo.create({
            user_id: user.uid,
            credential_id: credentialID,
            public_key: 'mock-public-key',
            counter: 0,
            device_name: 'Chrome on Mac (Mock)'
        });
        await logAudit(user, 'ENABLE_MFA', 'webauthn', credentialID, {});
        return { verified: true };
    }

    async verifyWebAuthnAuth(user, response) {
        return { verified: true };
    }
}
