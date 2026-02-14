import express from 'express';
import { AccountController } from './account.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new AccountController();

// All routes require auth
router.use(verifyFirebaseToken);

router.get('/emails', (req, res) => controller.getEmails(req, res));
router.post('/emails', (req, res) => controller.addEmail(req, res));
router.post('/emails/verify', (req, res) => controller.verifyEmail(req, res));
router.post('/emails/:id/set-primary', (req, res) => controller.setPrimaryEmail(req, res));
router.delete('/emails/:id', (req, res) => controller.removeEmail(req, res));
router.post('/emails/:id/resend-verification', (req, res) => controller.resendVerification(req, res));

export default router;
