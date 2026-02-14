import express from 'express';
import { GroupsController } from './groups.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

const router = express.Router();
const controller = new GroupsController();

router.use(verifyFirebaseToken);

router.get('/', (req, res) => controller.list(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

router.get('/:id/members', (req, res) => controller.listMembers(req, res));
router.post('/:id/members', (req, res) => controller.addMember(req, res));
router.delete('/:id/members/:memberId', (req, res) => controller.removeMember(req, res));

export default router;
