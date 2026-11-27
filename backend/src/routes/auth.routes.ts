import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { loginLimiter, passwordResetLimiter, registerLimiter } from '../middleware/rate-limit';

const router = Router();

router.post('/register', registerLimiter, controller.register);
router.post('/login', loginLimiter, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);
router.post('/forgot-password', passwordResetLimiter, controller.forgotPassword);
router.post('/reset-password', passwordResetLimiter, controller.resetPassword);

export default router;
