import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export class AuthController {
    constructor() {
        this.service = new AuthService();
    }

    async signup(req, res) {
        try {
            const { name, email, password, confirmPassword } = req.body;
            const result = await this.service.signup({ name, email, password, confirmPassword });

            // Set session cookie
            res.cookie('session', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 3600000 // 7 days
            });

            sendSuccess(res, result, 'Account created successfully', 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async loginWithPassword(req, res) {
        try {
            const { email, password } = req.body;
            const result = await this.service.loginWithPassword({ email, password });

            res.cookie('session', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 3600000
            });

            sendSuccess(res, result, 'Logged in successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async logout(req, res) {
        try {
            const userId = req.user?.uid;
            const result = await this.service.logout(userId);

            res.clearCookie('session', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            sendSuccess(res, result, 'Logged out successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await this.service.forgotPassword(email);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword, confirmPassword } = req.body;
            const result = await this.service.resetPassword({ token, newPassword, confirmPassword });
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async checkProvider(req, res) {
        try {
            const { email } = req.query;
            const result = await this.service.checkProvider(email);
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

            if (result.tokens.id_token) {
                res.cookie('session', result.tokens.id_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 3600000
                });
            }

            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async deactivateAccount(req, res) {
        try {
            const result = await this.service.deactivateAccount(req.user.uid);
            sendSuccess(res, result);
        } catch (error) {
            sendError(res, error);
        }
    }
}
