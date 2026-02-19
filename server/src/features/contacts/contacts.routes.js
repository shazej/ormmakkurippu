import express from 'express';
import { ContactsController } from './contacts.controller.js';
import { verifyFirebaseToken as authenticateUser } from '../../middleware/auth.js';

const router = express.Router();
const controller = new ContactsController();

router.use(authenticateUser);

router.get('/', controller.getContacts);
router.post('/', controller.createContact);

export default router;
