import express from 'express';
import { LinkedAccountsController } from './linked-accounts.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new LinkedAccountsController();

router.use(verifyFirebaseToken);

router.get('/', (req, res) => controller.list(req, res));
router.post('/link', (req, res) => controller.link(req, res));
router.post('/:id/unlink', (req, res) => controller.unlink(req, res));

export default router;
