import express from 'express';
import { ActivityController } from './activity.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new ActivityController();

router.use(verifyFirebaseToken);

router.get('/', (req, res) => controller.list(req, res));
router.get('/app-signins', (req, res) => controller.listAppSignins(req, res));

export default router;
