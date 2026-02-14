import express from 'express';
import { SettingsController } from './settings.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new SettingsController();

router.use(verifyFirebaseToken);

// Preferences
router.get('/preferences', (req, res) => controller.getPreferences(req, res));
router.put('/preferences', (req, res) => controller.updatePreferences(req, res));

// Notifications
router.get('/notifications', (req, res) => controller.getNotifications(req, res));
router.put('/notifications', (req, res) => controller.updateNotifications(req, res));
router.put('/marketing-mobile', (req, res) => controller.updateMarketingMobile(req, res));

// Authorized Websites
router.get('/authorized-websites', (req, res) => controller.listAuthorizedWebsites(req, res));
router.post('/authorized-websites/:id/revoke', (req, res) => controller.revokeAuthorizedWebsite(req, res));

export default router;
