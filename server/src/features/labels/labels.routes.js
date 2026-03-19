import express from 'express';
import { LabelsController } from './labels.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new LabelsController();

router.use(verifyFirebaseToken);

router.get('/', (req, res) => controller.getLabels(req, res));
router.post('/', (req, res) => controller.createLabel(req, res));

export default router;
