import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

export const auditLogger = (action: string, resource: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const _send = res.send;
        let responseBody: any;
        res.send = function (body) {
            responseBody = body;
            return _send.apply(res, arguments as any);
        };

        res.on('finish', async () => {
            try {
                let extractedUserId = req.user?.id || null;
                let extractedRole = req.user?.role || null;

                if (!extractedUserId && responseBody) {
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (parsed.data?.user?.id) extractedUserId = parsed.data.user.id;
                        if (parsed.data?.user?.role) extractedRole = parsed.data.user.role;
                    } catch (e) { }
                }

                await prisma.auditLog.create({
                    data: {
                        userId: extractedUserId,
                        role: extractedRole,
                        action,
                        resource,
                        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
                        result: res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
                        emergency: !!req.headers['x-emergency-flag'],
                        details: {
                            method: req.method,
                            url: req.originalUrl,
                            statusCode: res.statusCode,
                        },
                    },
                });
            } catch (err) {
                console.error('Audit Log failed (resilient):', err);
            }
        });

        next();
    };
};
