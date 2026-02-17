import express from 'express';
import { TasksController } from './tasks.controller.js';

const router = express.Router();
const controller = new TasksController();

// Public routes (no auth middleware)
router.get('/:token', (req, res) => controller.getSharedTask(req, res));

export default router;
