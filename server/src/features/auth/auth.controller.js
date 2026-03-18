import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
    constructor() {
        this.service = new AuthService();
    }

    async signup(req, res) {
        try {
            const { name, email, password, confirmPassword } = req.body;
            const result = await this.service.signup({ name, email, password, confirmPassword });

            res.cookie('session', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 3600000
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
            // Try to identify user for audit log without blocking logout on failure
            let userId = null;
            try {
                const authHeader = req.headers.authorization;
                const cookieToken = req.cookies?.session;
                const token = (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || cookieToken;
                if (token && process.env.JWT_SECRET) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    if (decoded?.uid) userId = decoded.uid;
                }
            } catch (_) { /* expired/invalid — still proceed */ }

            const result = await this.service.logout(userId);

            res.clearCookie('session', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
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
            if (!code) {
                return res.status(400).json({
                    success: false,
                    status: 'error',
                    message: 'Authorization code is required.',
                    code: 'VALIDATION_ERROR'
                });
            }

            const result = await this.service.loginWithGoogle(code);

            if (result.tokens?.id_token) {
                res.cookie('session', result.tokens.id_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 3600000 // 1 hour — matches Google token expiry
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
