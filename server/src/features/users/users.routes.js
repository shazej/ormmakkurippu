import express from 'express';
import { UsersController } from './users.controller.js';
import { verifyFirebaseToken as authenticateUser } from '../../middleware/auth.js';

const router = express.Router();
const controller = new UsersController();

router.use(authenticateUser);

router.get('/me', controller.getProfile);
router.patch('/me', controller.updateProfile);
router.patch('/me/preferences', controller.updatePreferences);

export default router;
