import express from 'express';
import { TasksController } from './tasks.controller.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';
import { paginationMiddleware } from '../../middleware/pagination.js';
import { upload } from '../../middleware/multer.js';

const router = express.Router();
const controller = new TasksController();

// Routes
router.use(verifyFirebaseToken);

router.get('/', paginationMiddleware, (req, res) => controller.getTasks(req, res));
router.get('/assigned-to-me', paginationMiddleware, (req, res) => controller.getAssignedTasks(req, res));
router.get('/today', (req, res) => controller.getTodayTasks(req, res));
router.get('/upcoming', (req, res) => controller.getUpcomingTasks(req, res));
router.post('/', (req, res) => controller.createTask(req, res));
router.post('/bulk', (req, res) => controller.bulkTasks(req, res));
router.get('/export.csv', (req, res) => controller.exportTasks(req, res));
router.post('/import', upload.single('file'), (req, res) => controller.importTasks(req, res));
router.get('/:id', (req, res) => controller.getTask(req, res));
router.put('/:id', (req, res) => controller.updateTask(req, res));
router.patch('/:id', (req, res) => controller.updateTask(req, res));
router.delete('/:id', (req, res) => controller.deleteTask(req, res));
router.post('/:id/share', (req, res) => controller.shareTask(req, res));
router.post('/:id/assign', (req, res) => controller.assignTask(req, res));

export default router;
