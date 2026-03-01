import { Response, NextFunction } from 'express';
import { PatientsService } from './patients.service';
import { AuthenticatedRequest } from '../../types';

export class PatientsController {
    static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const patients = await PatientsService.getAll(req.user);
            res.json({ status: 'success', data: { patients } });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const patient = await PatientsService.getById(req.params.id, req.user);
            res.json({ status: 'success', data: { patient } });
        } catch (error) {
            next(error);
        }
    }

    static async getPrivacyLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const logs = await PatientsService.getPrivacyLogs(req.user);
            res.json({ success: true, data: { logs } });
        } catch (error) {
            next(error);
        }
    }
}
