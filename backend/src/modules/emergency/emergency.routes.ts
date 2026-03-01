import { Router } from 'express';
import { EmergencyController } from './emergency.controller';
import { authenticateJWT } from '../../middleware/auth';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);

router.get('/', auditLogger('READ_ALL_EMERGENCIES', 'EmergencyAccess'), EmergencyController.getEmergencies);
router.post('/', auditLogger('REQUEST_EMERGENCY', 'Patient'), EmergencyController.requestAccess);
router.patch('/:patientId/revoke', auditLogger('REVOKE_EMERGENCY', 'Patient'), EmergencyController.revokeAccess);

export default router;
