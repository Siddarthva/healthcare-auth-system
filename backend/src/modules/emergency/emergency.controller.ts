import { Response, NextFunction } from 'express';
import { EmergencyService } from './emergency.service';
import { AuthenticatedRequest } from '../../types';
import { ForbiddenError } from '../../utils/errors';

export class EmergencyController {
    static async getEmergencies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const emergencies = await EmergencyService.getEmergencies(req.user);
            res.json({ success: true, data: { emergencies } });
        } catch (error) {
            next(error);
        }
    }

    static async requestAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'DOCTOR') {
                throw new ForbiddenError('Only doctors can request emergency access');
            }

            const access = await EmergencyService.requestAccess(req.user!.id, req.body.patientId, req.body.reason);
            res.status(201).json({ status: 'success', data: { access } });
        } catch (error) {
            next(error);
        }
    }

    static async revokeAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'DOCTOR') {
                throw new ForbiddenError('Only doctors can revoke their emergency access');
            }

            await EmergencyService.revokeAccess(req.user!.id, req.params.patientId);
            res.json({ status: 'success', message: 'Emergency access revoked' });
        } catch (error) {
            next(error);
        }
    }
}
