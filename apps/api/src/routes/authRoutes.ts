import { Router, type IRouter } from 'express';
import { authStatusController, googleCallbackController, googleLoginController, logoutController, meController } from '../controllers/authController.js';

export const authRouter: IRouter = Router();
authRouter.get('/me', meController);
authRouter.get('/google', googleLoginController);
authRouter.get('/google/callback', googleCallbackController);
authRouter.post('/logout', logoutController);
authRouter.get('/status', authStatusController);
