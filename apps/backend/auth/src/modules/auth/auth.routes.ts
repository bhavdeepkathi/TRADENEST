import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../../guards/authGuard';
import { asyncHandler } from '../../middlewares/errorHandler';
import { AuthController } from './auth.controller';
import { RegisterDtoSchema, LoginDtoSchema, VerifyOtpDtoSchema, ForgotPasswordDtoSchema, ResetPasswordDtoSchema, RefreshTokenSchema } from '@tradenest/common';
import { ValidationError } from '@tradenest/common';

const router = Router();
const controller = new AuthController();

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

// Public routes
router.post('/register', validate(RegisterDtoSchema), asyncHandler(controller.register));
router.post('/verify-otp', validate(VerifyOtpDtoSchema), asyncHandler(controller.verifyOtp));
router.post('/login', validate(LoginDtoSchema), asyncHandler(controller.login));
router.post('/refresh', validate(RefreshTokenSchema), asyncHandler(controller.refresh));
router.post('/forgot-password', validate(ForgotPasswordDtoSchema), asyncHandler(controller.forgotPassword));
router.post('/reset-password', validate(ResetPasswordDtoSchema), asyncHandler(controller.resetPassword));

// Protected routes
router.post('/logout', authGuard, asyncHandler(controller.logout));
router.post('/logout-all', authGuard, asyncHandler(controller.logoutAll));
router.get('/me', authGuard, asyncHandler(controller.me));

export { router as authRouter };