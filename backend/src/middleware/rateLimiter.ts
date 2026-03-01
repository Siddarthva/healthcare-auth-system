import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

export const rateLimiter = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${ip}`;

    try {
        const current = await redis.incr(key);
        if (current === 1) {
            // Set expiry for 1 minute window
            await redis.expire(key, 60);
        }

        if (current > 100) { // 100 req per minute
            res.status(429).json({ success: false, message: 'Too many requests, please try again later.', errorCode: 'RateLimitExceeded' });
            return;
        }
        next();
    } catch (err) {
        next(err);
    }
};
