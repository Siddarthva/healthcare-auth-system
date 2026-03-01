import { prisma } from '../../config/database';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../utils/errors';

export class ConsentService {
    static async grant(patientUserId: string, staffId: string) {
        // Ensure the staff is actually a medical staff
        const staff = await prisma.user.findUnique({ where: { id: staffId } });
        if (!staff || (staff.role !== 'DOCTOR' && staff.role !== 'NURSE')) {
            throw new BadRequestError('Can only grant consent to medical staff');
        }

        return prisma.consent.create({
            data: {
                patientId: patientUserId,
                staffId,
                status: 'ACTIVE',
            },
        });
    }

    static async revoke(consentId: string, patientUserId: string) {
        const consent = await prisma.consent.findUnique({ where: { id: consentId } });
        if (!consent) throw new NotFoundError('Consent not found');
        if (consent.patientId !== patientUserId) throw new ForbiddenError('Not your consent to revoke');

        return prisma.consent.update({
            where: { id: consentId },
            data: { status: 'REVOKED', revokedAt: new Date() },
        });
    }

    static async list(user: { id: string; role: string }) {
        if (user.role === 'PATIENT') {
            return prisma.consent.findMany({
                where: { patientId: user.id },
                include: { staff: { select: { name: true, role: true } } },
            });
        } else {
            return prisma.consent.findMany({
                where: { staffId: user.id },
                include: { patient: { select: { name: true, role: true } } },
            });
        }
    }
}
