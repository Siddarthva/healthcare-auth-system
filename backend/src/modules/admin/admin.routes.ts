import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateJWT, authorize } from '../../middleware/auth';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT, authorize('manage', 'all'));

router.get('/audit-logs', auditLogger('READ_AUDIT', 'AuditLog'), AdminController.getAuditLogs);
router.get('/assignments', auditLogger('READ_ASSIGNMENTS', 'Assignment'), AdminController.getAssignments);
router.post('/assignments', auditLogger('CREATE_ASSIGNMENT', 'Assignment'), AdminController.createAssignment);
router.delete('/assignments/:id', auditLogger('DELETE_ASSIGNMENT', 'Assignment'), AdminController.deleteAssignment);

export default router;
