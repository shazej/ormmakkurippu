import express from 'express';
import { AuthController } from './auth.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();
const controller = new AuthController();

// Public Routes (Rate Limited)
router.post('/reset-password', authLimiter, (req, res) => controller.resetPassword(req, res));
router.post('/verify-email', authLimiter, (req, res) => controller.verifyEmail(req, res));
router.post('/google', authLimiter, (req, res) => controller.googleLogin(req, res));

// Protected Routes
router.post('/deactivate', verifyFirebaseToken, (req, res) => controller.deactivateAccount(req, res));

export default router;
