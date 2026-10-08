import { Router, type IRouter } from 'express';
import { validateCartController } from '../controllers/cartController.js';

export const cartRouter: IRouter = Router();
cartRouter.post('/validate', validateCartController);
