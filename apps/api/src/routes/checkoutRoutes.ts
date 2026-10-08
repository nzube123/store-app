import { Router, type IRouter } from 'express';
import { createCheckoutController } from '../controllers/checkoutController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const checkoutRouter: IRouter = Router();
checkoutRouter.post('/', requireAuth, createCheckoutController);
