import express from 'express';
import { PrivacyController } from './privacy.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new PrivacyController();

router.use(verifyFirebaseToken);

// DPA
router.get('/dpa', (req, res) => controller.getDpa(req, res));
router.post('/dpa/initiate', (req, res) => controller.initiateDpa(req, res));
router.post('/dpa/:id/revoke', (req, res) => controller.revokeDpa(req, res));

// Contacts
router.get('/contacts', (req, res) => controller.listContacts(req, res));
router.post('/contacts', (req, res) => controller.addContact(req, res));
router.put('/contacts/:id', (req, res) => controller.updateContact(req, res));
router.delete('/contacts/:id', (req, res) => controller.deleteContact(req, res));

export default router;
