import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export class AdminController {
    static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const logs = await prisma.auditLog.findMany({
                orderBy: { timestamp: 'desc' },
                take: 500,
                include: { user: { select: { email: true, name: true, role: true } } }
            });
            res.json({ success: true, data: { logs } });
        } catch (error) {
            next(error);
        }
    }

    static async getAssignments(req: Request, res: Response, next: NextFunction) {
        try {
            const assignments = await prisma.assignment.findMany({
                include: {
                    staff: { select: { name: true, email: true, role: true } },
                    patient: { select: { user: { select: { name: true } }, medicalId: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: { assignments } });
        } catch (error) {
            next(error);
        }
    }

    static async createAssignment(req: Request, res: Response, next: NextFunction) {
        try {
            const { staffId, patientId } = req.body;
            const assignment = await prisma.assignment.create({
                data: { staffId, patientId }
            });
            res.status(201).json({ success: true, data: { assignment } });
        } catch (error) {
            next(error);
        }
    }

    static async deleteAssignment(req: Request, res: Response, next: NextFunction) {
        try {
            await prisma.assignment.delete({
                where: { id: req.params.id }
            });
            res.json({ success: true, message: 'Assignment deleted' });
        } catch (error) {
            next(error);
        }
    }
}
