
import express from 'express';
import { OnboardingController } from './onboarding.controller.js';
import { verifyFirebaseToken as authorize } from '../../middleware/auth.js';

const router = express.Router();
const controller = new OnboardingController();

router.use(authorize); // Protect all onboarding routes

router.get('/status', (req, res) => controller.getStatus(req, res));
router.post('/step', (req, res) => controller.updateStep(req, res));
router.post('/workspace', (req, res) => controller.createWorkspace(req, res));
router.post('/complete', (req, res) => controller.complete(req, res));

export default router;
