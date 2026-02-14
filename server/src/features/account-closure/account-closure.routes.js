import express from 'express';
import { AccountClosureController } from './account-closure.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new AccountClosureController();

router.use(verifyFirebaseToken);

router.post('/request', (req, res) => controller.request(req, res));
router.post('/confirm', (req, res) => controller.confirm(req, res));
router.post('/cancel', (req, res) => controller.cancel(req, res));

export default router;
