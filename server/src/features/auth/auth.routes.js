import express from 'express';
import { AuthController } from './auth.controller.js';
import { PasswordAuthController } from './password-auth.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();
const controller = new AuthController();
const pwController = new PasswordAuthController();

// ─── Email + Password Auth (Phase 1 — no Google required) ───────────────────
router.post('/signup', authLimiter, pwController.signup);
router.post('/login',  authLimiter, pwController.login);
router.post('/logout', pwController.logout);

// ─── Google OAuth (guarded by ENABLE_GOOGLE_AUTH env flag) ──────────────────
// TODO[google-auth]: Set ENABLE_GOOGLE_AUTH=true in .env to re-enable
router.post('/google', authLimiter, (req, res) => {
    if (process.env.ENABLE_GOOGLE_AUTH !== 'true') {
        return res.status(501).json({ success: false, message: 'Google auth is disabled in this environment.' });
    }
    controller.googleLogin(req, res);
});

// ─── Legacy helpers ──────────────────────────────────────────────────────────
router.post('/reset-password', authLimiter, (req, res) => controller.resetPassword(req, res));
router.post('/verify-email',   authLimiter, (req, res) => controller.verifyEmail(req, res));

// ─── Protected ───────────────────────────────────────────────────────────────
router.post('/deactivate', verifyFirebaseToken, (req, res) => controller.deactivateAccount(req, res));

export default router;
