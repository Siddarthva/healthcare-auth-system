import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.register(req.body);
            res.status(201).json({ success: true, message: "User registered. OTP sent to email." });
        } catch (error) {
            next(error);
        }
    }

    static async verifyOtp(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.verifyOtp(req.body);
            res.status(200).json({ success: true, message: "Email verified successfully" });
        } catch (error) {
            next(error);
        }
    }

    static async resendOtp(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.resendOtp(req.body.email);
            res.status(200).json({ success: true, message: "OTP resent successfully" });
        } catch (error) {
            next(error);
        }
    }

    static async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.forgotPassword(req.body.email);
            res.status(200).json({ success: true, message: "Password reset instructions sent" });
        } catch (error) {
            next(error);
        }
    }

    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.resetPassword(req.body);
            res.status(200).json({ success: true, message: "Password reset successfully" });
        } catch (error) {
            next(error);
        }
    }

    static async magicLink(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.magicLink(req.body.email);
            res.status(200).json({ success: true, message: "Magic link sent to email" });
        } catch (error) {
            next(error);
        }
    }

    static async magicLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.magicLogin(req.query.token as string);
            const { user, accessToken, refreshToken } = result;
            res.status(200).json({ success: true, data: { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken } });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body);
            const { user, accessToken, refreshToken } = result;
            // Exclude mapping passwordHash later in formatting
            res.status(200).json({ success: true, data: { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken } });
        } catch (error) {
            next(error);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.refresh(req.body.token);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const accessToken = req.headers.authorization?.split(' ')[1];
            await AuthService.logout(req.body.token, accessToken);
            res.status(200).json({ success: true, message: "Logged out completely" });
        } catch (error) {
            next(error);
        }
    }
}
