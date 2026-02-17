import express from 'express';
import { TasksController } from './tasks.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { paginationMiddleware } from '../../middleware/pagination.js';

const router = express.Router();
const controller = new TasksController();

// Routes
router.use(verifyFirebaseToken);

router.get('/', paginationMiddleware, (req, res) => controller.getTasks(req, res));
router.post('/', (req, res) => controller.createTask(req, res));
router.get('/:id', (req, res) => controller.getTask(req, res));
router.put('/:id', (req, res) => controller.updateTask(req, res));
router.delete('/:id', (req, res) => controller.deleteTask(req, res));
router.post('/:id/share', (req, res) => controller.shareTask(req, res));

export default router;
