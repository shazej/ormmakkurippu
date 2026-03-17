import { z } from 'zod';
import { PasswordAuthService } from './password-auth.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

const service = new PasswordAuthService();

const signupSchema = z.object({
    name:             z.string().min(1).max(100).trim().optional(),
    email:            z.string().email().trim().toLowerCase(),
    password:         z.string().min(8),
    confirm_password: z.string().min(8),
}).refine(d => d.password === d.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
});

const loginSchema = z.object({
    email:    z.string().email().trim().toLowerCase(),
    password: z.string().min(1),
});

export class PasswordAuthController {

    signup = async (req, res) => {
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) {
            const msg = parsed.error.errors[0]?.message || 'Invalid input.';
            return res.status(400).json({ success: false, message: msg, errors: parsed.error.errors });
        }
        try {
            const result = await service.signup(parsed.data);
            // Set HTTP-only cookie
            res.cookie('session', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
            });
            sendSuccess(res, result, 'Account created', 201);
        } catch (err) {
            sendError(res, err);
        }
    };

    login = async (req, res) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            const msg = parsed.error.errors[0]?.message || 'Invalid input.';
            return res.status(400).json({ success: false, message: msg });
        }
        try {
            const result = await service.login(parsed.data);
            res.cookie('session', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            sendSuccess(res, result, 'Logged in');
        } catch (err) {
            sendError(res, err);
        }
    };

    logout = (req, res) => {
        res.clearCookie('session');
        sendSuccess(res, null, 'Logged out');
    };
}
