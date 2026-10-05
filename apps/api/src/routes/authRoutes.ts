import { Router, type IRouter } from 'express';
import { authStatusController, googleCallbackController, googleLoginController, googleMobileAuthController, logoutController, meController } from '../controllers/authController.js';
import { authenticateOptional } from '../middleware/requireAuth.js';

export const authRouter: IRouter = Router();
authRouter.get('/me', authenticateOptional, meController);
authRouter.get('/google', googleLoginController);
authRouter.get('/google/callback', googleCallbackController);
authRouter.post('/google/mobile', googleMobileAuthController);
authRouter.post('/logout', logoutController);
authRouter.get('/status', authenticateOptional, authStatusController);
