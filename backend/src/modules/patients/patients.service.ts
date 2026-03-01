import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { defineAbilityFor } from '../../policies/abilities';

export class PatientsService {
    static async getAll(user: any) {
        const ability = defineAbilityFor(user);
        if (ability.can('manage', 'Patient')) {
            return prisma.patient.findMany({ include: { user: { select: { name: true, email: true } } } });
        }

        // Otherwise, restrict based on assignments and consents
        if (user.role === 'DOCTOR' || user.role === 'NURSE') {
            return prisma.patient.findMany({
                where: {
                    OR: [
                        { assignments: { some: { staffId: user.id } } }
                    ],
                },
                include: { user: { select: { name: true } } }
            });
            // Consents would require a subquery or join to patient.userId which isn't easy in `OR`
            // since consent targets the `User` id not `Patient` id directly, wait, consent has `patientId` but it maps to User.id.
        }

        if (user.role === 'PATIENT') {
            return prisma.patient.findMany({ where: { userId: user.id } });
        }

        throw new ForbiddenError('Access Denied');
    }

    static async getById(id: string, user: any) {
        const patient = await prisma.patient.findUnique({
            where: { id },
            include: { user: { select: { name: true, email: true } } },
        });

        if (!patient) throw new NotFoundError('Patient not found');

        const ability = defineAbilityFor(user);
        const hasEmergency = await prisma.emergencyAccess.findFirst({
            where: { doctorId: user.id, patientId: id, expiresAt: { gt: new Date() } }
        });

        if (ability.can('manage', 'Patient') || hasEmergency) {
            return patient; // Full access
        }

        const assignment = await prisma.assignment.findFirst({ where: { patientId: id, staffId: user.id } });
        const consent = await prisma.consent.findFirst({ where: { patientId: patient.userId, staffId: user.id, status: 'ACTIVE' } });

        if (user.role === 'PATIENT' && patient.userId === user.id) {
            return patient;
        }

        if (!assignment && !consent) {
            throw new ForbiddenError('You are not assigned to this patient and have no active consent');
        }

        if (user.role === 'NURSE') {
            const { history, ...safePatientData } = patient;
            return safePatientData;
        }

        return patient;
    }

    static async getPrivacyLogs(user: any) {
        if (user.role !== 'PATIENT') return [];

        const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
        if (!patient) return [];

        const allLogs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 1000,
            include: { user: { select: { email: true, name: true, role: true } } }
        });

        return allLogs.filter(log => {
            const detailsStr = JSON.stringify(log.details || {});
            return detailsStr.includes(patient.id) || (log.resource.includes(patient.id));
        });
    }
}
