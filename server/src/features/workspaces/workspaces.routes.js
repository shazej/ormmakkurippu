import express from 'express';
import { WorkspacesController } from './workspaces.controller.js';
import { verifyFirebaseToken as authenticateUser } from '../../middleware/auth.js';

const router = express.Router();
const controller = new WorkspacesController();

router.use(authenticateUser);

router.get('/current', controller.getCurrentWorkspace);
router.patch('/current', controller.updateCurrentWorkspace);
router.delete('/current/members/:userId', controller.removeMember);
router.get('/', controller.getWorkspaces);
router.post('/', controller.createWorkspace);
router.post('/:id/invite', controller.inviteMember);

export default router;
