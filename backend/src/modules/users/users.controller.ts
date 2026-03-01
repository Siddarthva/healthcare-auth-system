import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

export class UsersController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await UsersService.getAll();
            res.json({ status: 'success', data: { users } });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UsersService.getById(req.params.id);
            res.json({ status: 'success', data: { user } });
        } catch (error) {
            next(error);
        }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UsersService.updateStatus(req.params.id, req.body.status);
            res.json({ status: 'success', data: { user } });
        } catch (error) {
            next(error);
        }
    }
}
