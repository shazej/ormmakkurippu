import express from 'express';
import { AuthController } from './auth.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { authLimiter, providerCheckLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();
const controller = new AuthController();

// Public Routes (Rate Limited)
router.post('/signup',           authLimiter,         (req, res) => controller.signup(req, res));
router.post('/login',            authLimiter,         (req, res) => controller.loginWithPassword(req, res));
router.post('/google',           authLimiter,         (req, res) => controller.googleLogin(req, res));
router.post('/forgot-password',  authLimiter,         (req, res) => controller.forgotPassword(req, res));
router.post('/reset-password',   authLimiter,         (req, res) => controller.resetPassword(req, res));
router.get('/check-provider',    providerCheckLimiter,(req, res) => controller.checkProvider(req, res));

// Public logout — clears session cookie and audit-logs if token is present
// Not behind verifyFirebaseToken so expired/missing tokens don't block client-side logout
router.post('/logout', (req, res) => controller.logout(req, res));

// Protected Routes
router.post('/deactivate', verifyFirebaseToken, (req, res) => controller.deactivateAccount(req, res));

export default router;
