import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller.js';
import { PasswordAuthController } from './password-auth.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();
const controller = new AuthController();
const pwController = new PasswordAuthController();
const prisma = new PrismaClient();

// ─── Email + Password Auth ────────────────────────────────────────────────────
router.post('/signup', authLimiter, pwController.signup);
router.post('/login',  authLimiter, pwController.login);
router.post('/logout', pwController.logout);

// ─── Provider check ───────────────────────────────────────────────────────────
// Returns { provider: 'password' | 'google' | 'none' }
// Used by the login page to adapt its UI before attempting login.
// 'none'     → email not registered → default to password form + suggest signup
// 'password' → account has a password hash → show password form
// 'google'   → Google-only account (no password_hash) → show Google CTA
router.post('/check-provider', authLimiter, async (req, res) => {
    try {
        const email = req.body?.email?.trim()?.toLowerCase();
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

        const user = await prisma.user.findUnique({
            where:  { primary_email_id: email },
            select: { google_uid: true, password_hash: true },
        });

        if (!user) return res.json({ success: true, provider: 'none' });

        const provider = (user.google_uid && !user.password_hash) ? 'google' : 'password';
        return res.json({ success: true, provider });
    } catch (err) {
        console.error('[check-provider]', err);
        return res.status(500).json({ success: false, message: 'Could not determine provider.' });
    }
});

// ─── Google OAuth (guarded by ENABLE_GOOGLE_AUTH env flag) ───────────────────
// TODO[google-auth]: Set ENABLE_GOOGLE_AUTH=true in .env to re-enable
router.post('/google', authLimiter, (req, res) => {
    if (process.env.ENABLE_GOOGLE_AUTH !== 'true') {
        return res.status(501).json({ success: false, message: 'Google auth is disabled in this environment.' });
    }
    controller.googleLogin(req, res);
});

// ─── Legacy helpers ───────────────────────────────────────────────────────────
router.post('/reset-password', authLimiter, (req, res) => controller.resetPassword(req, res));
router.post('/verify-email',   authLimiter, (req, res) => controller.verifyEmail(req, res));

// ─── Protected ────────────────────────────────────────────────────────────────
router.post('/deactivate', verifyFirebaseToken, (req, res) => controller.deactivateAccount(req, res));

export default router;
