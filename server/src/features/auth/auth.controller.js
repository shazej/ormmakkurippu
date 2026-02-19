import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export class AuthController {
    constructor() {
        this.service = new AuthService();
    }

    async resetPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) throw new Error('Email is required');
            const result = await this.service.resetPassword(email);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async verifyEmail(req, res) {
        try {
            const { email } = req.body;
            if (!email) throw new Error('Email is required');
            const result = await this.service.verifyEmail(email);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async deactivateAccount(req, res) {
        try {
            const result = await this.service.deactivateAccount(req.user.uid, req.user);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async googleLogin(req, res) {
        try {
            const { code } = req.body;
            if (!code) throw new Error('Authorization code is required');

            const result = await this.service.loginWithGoogle(code);

            // Set HTTP-only cookie for session security
            if (result.tokens.id_token) {
                res.cookie('session', result.tokens.id_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 3600000 // 1 hour
                });
            }

            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error, 401);
        }
    }
}
