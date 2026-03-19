import express from 'express';
import { ContactsController } from './contacts.controller.js';
import { verifyFirebaseToken as authenticateUser } from '../../middleware/auth.js';

const router = express.Router();
const controller = new ContactsController();

router.use(authenticateUser);

router.get('/', controller.getContacts);
router.post('/', controller.createContact);
router.get('/:id', controller.getContact);
router.patch('/:id', controller.updateContact);
router.delete('/:id', controller.deleteContact);

export default router;
