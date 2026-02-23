import express from 'express';
import { ProjectsController } from './projects.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new ProjectsController();

router.use(verifyFirebaseToken);

router.get('/', controller.listProjects);
router.post('/', controller.createProject);
router.patch('/:id', controller.updateProject);
router.post('/:id/archive', controller.archiveProject);
router.post('/:id/unarchive', controller.unarchiveProject);

export default router;
