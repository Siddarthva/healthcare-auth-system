import { Router } from 'express';
import { PatientsController } from './patients.controller';
import { authenticateJWT, authorize } from '../../middleware/auth';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);

router.get('/privacy', auditLogger('READ_PRIVACY_LOGS', 'Privacy'), PatientsController.getPrivacyLogs);

router.get(
    '/',
    authorize('read', 'Patient'),
    auditLogger('READ_ALL', 'Patient'),
    PatientsController.getAll
);

router.get(
    '/:id',
    authorize('read', 'Patient'),
    auditLogger('READ_ONE', 'Patient'),
    PatientsController.getById
);

// We can add CRUD endpoints here similarly...

export default router;
