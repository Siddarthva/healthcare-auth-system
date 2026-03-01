import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshSchema, verifyOtpSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema, magicLinkSchema, magicLoginSchema } from './auth.schema';
import { rateLimiter } from '../../middleware/rateLimiter';
import { auditLogger } from '../../middleware/auditLogger';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

router.post(
    '/register',
    rateLimiter,
    validateRequest(registerSchema),
    auditLogger('REGISTER', 'User'),
    AuthController.register
);

router.post(
    '/login',
    rateLimiter,
    validateRequest(loginSchema),
    auditLogger('LOGIN', 'User'),
    AuthController.login
);

router.post(
    '/verify-otp',
    rateLimiter,
    validateRequest(verifyOtpSchema),
    auditLogger('VERIFY_OTP', 'User'),
    AuthController.verifyOtp
);

router.post(
    '/resend-otp',
    rateLimiter,
    validateRequest(resendOtpSchema),
    auditLogger('RESEND_OTP', 'User'),
    AuthController.resendOtp
);

router.post(
    '/refresh',
    validateRequest(refreshSchema),
    AuthController.refresh
);

router.post(
    '/forgot-password',
    rateLimiter,
    validateRequest(forgotPasswordSchema),
    auditLogger('FORGOT_PASSWORD', 'User'),
    AuthController.forgotPassword
);

router.post(
    '/reset-password',
    rateLimiter,
    validateRequest(resetPasswordSchema),
    auditLogger('RESET_PASSWORD', 'User'),
    AuthController.resetPassword
);

router.post(
    '/magic-link',
    rateLimiter,
    validateRequest(magicLinkSchema),
    auditLogger('MAGIC_LINK', 'User'),
    AuthController.magicLink
);

router.get(
    '/magic-login',
    rateLimiter,
    validateRequest(magicLoginSchema),
    auditLogger('MAGIC_LOGIN', 'User'),
    AuthController.magicLogin
);

router.post(
    '/logout',
    authenticateJWT,
    auditLogger('LOGOUT', 'User'),
    AuthController.logout
);

export default router;
