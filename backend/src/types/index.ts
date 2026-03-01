import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Type extending Express Request if needed
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export type AsyncRequestHandler = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => Promise<any>;
