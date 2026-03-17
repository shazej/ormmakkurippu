/**
 * Task Sharing Routes — PUBLIC (no authentication)
 *
 * Mounted at: /api/shared
 *
 * GET /api/shared/tasks/:token  → resolve token → return safe task projection
 *
 * Intentionally separate from /api/tasks to make it visually clear that
 * these endpoints carry no auth middleware.
 *
 * sharePublicLimiter is applied per-route (stricter than the global apiLimiter)
 * because this endpoint is unauthenticated and could be used for token enumeration.
 */

import express from 'express';
import { TaskSharingController } from './task-sharing.controller.js';
import { sharePublicLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();
const controller = new TaskSharingController();

router.get('/tasks/:token', sharePublicLimiter, (req, res) => controller.getSharedTask(req, res));

export default router;
