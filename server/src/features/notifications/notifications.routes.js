import express from 'express';
import { NotificationsController } from './notifications.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new NotificationsController();

router.use(verifyFirebaseToken);

// Notification list & unread count
router.get('/', (req, res) => controller.getNotifications(req, res));
router.get('/unread-count', (req, res) => controller.getUnreadCount(req, res));

// Mark as read
router.post('/:id/read', (req, res) => controller.markAsRead(req, res));
router.post('/read-all', (req, res) => controller.markAllAsRead(req, res));

// Preferences
router.get('/preferences', (req, res) => controller.getPreferences(req, res));
router.patch('/preferences', (req, res) => controller.updatePreferences(req, res));

// Internal/dev: trigger reminder processing
router.post('/process-reminders', (req, res) => controller.processReminders(req, res));

export default router;
