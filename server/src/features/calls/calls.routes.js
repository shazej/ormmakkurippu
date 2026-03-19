import express from 'express';
import { CallLogsController } from './calls.controller.js';
import { verifyFirebaseToken as authenticateUser } from '../../middleware/auth.js';

const router = express.Router();
const controller = new CallLogsController();

router.use(authenticateUser);

router.get('/', controller.getCallLogs);
router.post('/', controller.createCallLog);
router.post('/task', controller.createTaskFromCall);
router.get('/:id', controller.getCallLog);
router.patch('/:id', controller.updateCallLog);
router.delete('/:id', controller.deleteCallLog);

export default router;
