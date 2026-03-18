import express from 'express';
import { AuthController } from './auth.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();
const controller = new AuthController();

// Public Routes (Rate Limited)
router.post('/signup', authLimiter, (req, res) => controller.signup(req, res));
router.post('/login', authLimiter, (req, res) => controller.loginWithPassword(req, res));
router.post('/google', authLimiter, (req, res) => controller.googleLogin(req, res));
router.post('/forgot-password', authLimiter, (req, res) => controller.forgotPassword(req, res));
router.post('/reset-password', authLimiter, (req, res) => controller.resetPassword(req, res));
router.get('/check-provider', (req, res) => controller.checkProvider(req, res));

// Protected Routes
router.post('/logout', verifyFirebaseToken, (req, res) => controller.logout(req, res));
router.post('/deactivate', verifyFirebaseToken, (req, res) => controller.deactivateAccount(req, res));

export default router;
