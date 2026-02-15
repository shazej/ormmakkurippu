import express from 'express';
import { ComplianceController } from './compliance.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { verifyRole } from '../../middleware/rbac.js';

const router = express.Router();
const controller = new ComplianceController();

// Public / Read-Only
router.get('/certifications', (req, res) => controller.getAll(req, res));
router.get('/certifications/:id', (req, res) => controller.getOne(req, res));

// Admin Protected
router.post('/certifications', verifyFirebaseToken, verifyRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => controller.create(req, res));
router.put('/certifications/:id', verifyFirebaseToken, verifyRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => controller.update(req, res));
router.delete('/certifications/:id', verifyFirebaseToken, verifyRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => controller.delete(req, res));

export default router;

