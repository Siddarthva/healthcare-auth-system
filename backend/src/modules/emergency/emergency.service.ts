import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { ForbiddenError, NotFoundError } from '../../utils/errors';

export class EmergencyService {
    static async requestAccess(doctorId: string, patientId: string, reason: string) {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) throw new NotFoundError('Patient not found');

        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

        const access = await prisma.emergencyAccess.create({
            data: {
                doctorId,
                patientId,
                reason,
                expiresAt,
            },
        });

        // Cache permission temporarily to allow faster ABAC check
        await redis.setex(`emergency:${doctorId}:${patientId}`, 2 * 60 * 60, access.id);

        return access;
    }

    static async revokeAccess(doctorId: string, patientId: string) {
        const accessList = await prisma.emergencyAccess.findMany({
            where: { doctorId, patientId, expiresAt: { gt: new Date() } }
        });

        if (!accessList.length) throw new NotFoundError('No active emergency access found');

        for (const access of accessList) {
            await prisma.emergencyAccess.update({
                where: { id: access.id },
                data: { expiresAt: new Date() } // Expire immediately
            });
        }

        await redis.del(`emergency:${doctorId}:${patientId}`);
    }

    static async getEmergencies(user: any) {
        if (user.role === 'ADMIN') {
            return prisma.emergencyAccess.findMany({
                include: {
                    doctor: { select: { name: true, email: true } },
                    patient: { select: { user: { select: { name: true } }, medicalId: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (user.role === 'DOCTOR') {
            return prisma.emergencyAccess.findMany({
                where: { doctorId: user.id },
                include: {
                    patient: { select: { user: { select: { name: true } }, medicalId: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        return [];
    }
}
