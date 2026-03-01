import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { AppError, UnauthorizedError, BadRequestError } from '../../utils/errors';
import { generateOTP } from '../../utils/otp';
import { storeOTP, verifyOTP, storeMagicToken, verifyMagicToken } from '../../services/otp.service';
import { sendOTPEmail, sendPasswordResetEmail, sendMagicLinkEmail } from '../../services/mail.service';
import crypto from 'crypto';

export class AuthService {
    static async register(data: any) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new BadRequestError('Email already in use');

        const passwordHash = await argon2.hash(data.password);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
                role: data.role,
            },
        });

        if (user.role === 'PATIENT') {
            await prisma.patient.create({
                data: {
                    userId: user.id,
                    dateOfBirth: new Date(), // Mock date, usually from body
                    medicalId: `MED-${Date.now()}`,
                },
            });
        }

        const otp = generateOTP();
        await storeOTP(user.email, otp);
        await sendOTPEmail(user.email, otp);

        const { passwordHash: _, ...rest } = user;
        return { user: rest };
    }

    static async verifyOtp(data: any) {
        const { email, otp } = data;
        const valid = await verifyOTP(email, otp);

        if (!valid) {
            throw new BadRequestError('Invalid or expired OTP');
        }

        await prisma.user.update({
            where: { email },
            data: { isVerified: true } as any,
        });

        return true;
    }

    static async resendOtp(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new BadRequestError('User not found');
        if ((user as any).isVerified) throw new BadRequestError('User already verified');

        const otp = generateOTP();
        await storeOTP(user.email, otp);
        await sendOTPEmail(user.email, otp);
        return true;
    }

    static async login(data: any) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user || user.status !== 'ACTIVE') {
            throw new UnauthorizedError('Invalid credentials or inactive account');
        }

        if (!(user as any).isVerified) {
            throw new UnauthorizedError('Please verify your email first');
        }

        const isValid = await argon2.verify(user.passwordHash, data.password);
        if (!isValid) throw new UnauthorizedError('Invalid credentials');

        const payload = { id: user.id, role: user.role };
        const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRATION as any });
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRATION as any });

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return { user, accessToken, refreshToken };
    }

    static async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return true;
        }

        const otp = generateOTP();
        await storeOTP(user.email, otp);
        await sendPasswordResetEmail(user.email, otp);

        return true;
    }

    static async resetPassword(data: any) {
        const { email, otp, newPassword } = data;
        const valid = await verifyOTP(email, otp);

        if (!valid) {
            throw new BadRequestError('Invalid or expired OTP');
        }

        const passwordHash = await argon2.hash(newPassword);

        await prisma.user.update({
            where: { email },
            data: { passwordHash }
        });

        return true;
    }

    static async magicLink(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== 'ACTIVE') {
            return true;
        }

        const token = crypto.randomBytes(32).toString('hex');
        await storeMagicToken(token, user.id);

        const magicLinkUrl = `http://localhost:5173/magic-login?token=${token}`;
        await sendMagicLinkEmail(user.email, magicLinkUrl);

        return true;
    }

    static async magicLogin(token: string) {
        const userId = await verifyMagicToken(token);
        if (!userId) {
            throw new UnauthorizedError('Invalid or expired magic link');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.status !== 'ACTIVE') {
            throw new UnauthorizedError('User account is invalid or inactive');
        }

        const payload = { id: user.id, role: user.role };
        const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRATION as any });
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRATION as any });

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return { user, accessToken, refreshToken };
    }

    static async refresh(token: string) {
        const record = await prisma.refreshToken.findUnique({ where: { token } });
        if (!record || record.expiresAt < new Date()) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
        } catch (e) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const payload = { id: decoded.id, role: decoded.role };
        const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRATION as any });
        return { accessToken };
    }

    static async logout(token: string, accessToken?: string) {
        await prisma.refreshToken.delete({ where: { token } }).catch(() => { });
        if (accessToken) {
            // Check expiresIn from decoded token to set correct Redis expiry to avoid memory bloat
            try {
                const decoded = jwt.decode(accessToken) as any;
                if (decoded && decoded.exp) {
                    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                    if (ttl > 0) {
                        await redis.setex(`blacklist:${accessToken}`, ttl, 'true');
                    }
                }
            } catch (e) { }
        }
    }
}
