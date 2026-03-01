import { Router } from 'express';
import { ConsentController } from './consent.controller';
import { authenticateJWT, authorize } from '../../middleware/auth';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT, authorize('manage', 'Consent'));
// usually patient applies this policy to their own consents via logic

router.post('/', auditLogger('GRANT', 'Consent'), ConsentController.grant);
router.patch('/:id/revoke', auditLogger('REVOKE', 'Consent'), ConsentController.revoke);
router.get('/', auditLogger('LIST', 'Consent'), ConsentController.list);

export default router;
