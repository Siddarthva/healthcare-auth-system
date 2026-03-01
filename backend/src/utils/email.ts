import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});

export const sendOTP = async (to: string, otp: string) => {
    const mailOptions = {
        from: env.EMAIL_USER,
        to,
        subject: 'Your Login OTP',
        html: `<h3>Your OTP is: ${otp}</h3><p>It will expire in 5 minutes.</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`OTP email sent to ${to}`);
    } catch (error) {
        logger.error(`Failed to send OTP to ${to}`, error);
        throw new Error('Failed to send email');
    }
};
