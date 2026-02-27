import express from 'express';
import { AuthController } from './auth.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';
import { DEMO_USERS, signDemoToken, upsertDemoUser } from './demo-auth.service.js';

const router = express.Router();
const controller = new AuthController();

// Public Routes (Rate Limited)
router.post('/reset-password', authLimiter, (req, res) => controller.resetPassword(req, res));
router.post('/verify-email', authLimiter, (req, res) => controller.verifyEmail(req, res));
router.post('/google', authLimiter, (req, res) => controller.googleLogin(req, res));

// DEMO Login (only available when DEMO_AUTH=true)
router.post('/demo-login', authLimiter, async (req, res) => {
    if (process.env.DEMO_AUTH !== 'true') {
        return res.status(404).json({ success: false, error: 'Not found' });
    }
    try {
        const { email } = req.body;
        if (!email || !DEMO_USERS[email]) {
            return res.status(401).json({ success: false, error: 'Invalid demo user' });
        }
        const user = await upsertDemoUser(email);
        const token = signDemoToken(email);
        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.primary_email_id,
                name: user.display_name,
                role: user.role,
                is_onboarded: user.is_onboarded,
                onboarding_step: user.onboarding_step,
                default_workspace_id: user.default_workspace_id,
            },
        });
    } catch (err) {
        console.error('[DEMO_AUTH] demo-login error:', err.message);
        return res.status(500).json({ success: false, error: 'Demo login failed' });
    }
});

// Protected Routes
router.post('/deactivate', verifyFirebaseToken, (req, res) => controller.deactivateAccount(req, res));

export default router;
