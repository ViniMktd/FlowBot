import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validateRequest } from '@/middleware/validation';
import { authentication } from '@/middleware/auth';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema
} from '@/schemas';

const router = Router();
const authController = new AuthController();

// Rotas públicas (não requerem autenticação)
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

// Rotas protegidas (requerem autenticação)
router.use(authentication);

router.get('/profile', authController.getProfile);
router.put('/profile', validateRequest(updateProfileSchema), authController.updateProfile);
router.post('/change-password', validateRequest(changePasswordSchema), authController.changePassword);
router.post('/logout', authController.logout);

export default router;
