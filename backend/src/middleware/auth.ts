import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';
import { defineAbilityFor, Actions, Subjects } from '../policies/abilities';
import { redis } from '../config/redis';

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Missing or invalid token'));
    }

    const token = authHeader.split(' ')[1];

    try {
        // Check token blacklist
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return next(new UnauthorizedError('Token invalidated'));
        }

        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string; role: string };
        req.user = decoded;
        next();
    } catch (err) {
        next(new UnauthorizedError('Invalid token'));
    }
};

export const authorize = (action: Actions, subject: Subjects) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedError('Not authenticated'));
        }

        const ability = defineAbilityFor(req.user);

        if (ability.can(action, subject)) {
            next();
        } else {
            next(new ForbiddenError('You do not have permission to perform this action'));
        }
    };
};
