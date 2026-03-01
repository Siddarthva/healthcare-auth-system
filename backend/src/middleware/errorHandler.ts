import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errorCode: err.constructor.name
        });
        return;
    }

    // If Zod error or Prisma Error, we could map them here.
    // For simplicity, just log it.
    logger.error('Unhandled Exception', { err });

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errorCode: 'InternalResourceError'
    });
};
