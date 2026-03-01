import { Router } from 'express';
import { ConsentController } from './consent.controller';
import { authenticateJWT, authorize } from '../../middleware/auth';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);
// usually patient applies this policy to their own consents via logic

router.post('/', authorize('manage', 'Consent'), auditLogger('GRANT', 'Consent'), ConsentController.grant);
router.patch('/:id/revoke', authorize('manage', 'Consent'), auditLogger('REVOKE', 'Consent'), ConsentController.revoke);
router.get('/', authorize('read', 'Consent'), auditLogger('LIST', 'Consent'), ConsentController.list);

export default router;
