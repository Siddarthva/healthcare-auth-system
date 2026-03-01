import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class UsersService {
    static async getAll() {
        return prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
        });
    }

    static async getById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
        });
        if (!user) throw new NotFoundError('User not found');
        return user;
    }

    static async updateStatus(id: string, status: string) {
        return prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, name: true, status: true },
        });
    }
}
