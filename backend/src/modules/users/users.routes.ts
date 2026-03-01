import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJWT, authorize } from '../../middleware/auth';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT, authorize('manage', 'User'));

router.get('/', auditLogger('READ_ALL', 'User'), UsersController.getAll);
router.get('/:id', auditLogger('READ_ONE', 'User'), UsersController.getById);
router.patch('/:id/status', auditLogger('UPDATE_STATUS', 'User'), UsersController.updateStatus);

export default router;
