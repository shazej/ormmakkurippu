import express from 'express';
import { CallLogsController } from './calls.controller.js';
import { verifyFirebaseToken as authenticateUser } from '../../middleware/auth.js';

const router = express.Router();
const controller = new CallLogsController();

router.use(authenticateUser);

router.get('/', controller.getCallLogs);
router.post('/', controller.createCallLog);
router.post('/task', controller.createTaskFromCall);

export default router;
