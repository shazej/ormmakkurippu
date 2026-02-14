import express from 'express';
import { SecurityController } from './security.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new SecurityController();

// All routes require auth
router.use(verifyFirebaseToken);

// Sessions
router.get('/sessions', (req, res) => controller.getSessions(req, res));
router.post('/sessions/:id/revoke', (req, res) => controller.revokeSession(req, res));
router.post('/sessions/revoke-others', (req, res) => controller.revokeOtherSessions(req, res));

// Allowed IPs
router.get('/allowed-ips', (req, res) => controller.getAllowedIps(req, res));
router.post('/allowed-ips', (req, res) => controller.addAllowedIp(req, res));
router.delete('/allowed-ips/:id', (req, res) => controller.removeAllowedIp(req, res));

// Geofence
router.get('/geofence', (req, res) => controller.getGeofence(req, res));
router.put('/geofence', (req, res) => controller.updateGeofence(req, res));

// Passwords
router.post('/change-password', (req, res) => controller.changePassword(req, res));

// App Passwords
router.get('/app-passwords', (req, res) => controller.getAppPasswords(req, res));
router.post('/app-passwords', (req, res) => controller.generateAppPassword(req, res));
router.post('/app-passwords/:id/revoke', (req, res) => controller.revokeAppPassword(req, res));

export default router;
