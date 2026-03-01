import { Response, NextFunction } from 'express';
import { ConsentService } from './consent.service';
import { AuthenticatedRequest } from '../../types';

export class ConsentController {
    static async grant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // req.user.id is the patient's User ID
            const consent = await ConsentService.grant(req.user!.id, req.body.staffId);
            res.status(201).json({ status: 'success', data: { consent } });
        } catch (error) {
            next(error);
        }
    }

    static async revoke(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const consent = await ConsentService.revoke(req.params.id, req.user!.id);
            res.json({ status: 'success', data: { consent } });
        } catch (error) {
            next(error);
        }
    }

    static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const consents = await ConsentService.list(req.user!);
            res.json({ status: 'success', data: { consents } });
        } catch (error) {
            next(error);
        }
    }
}
