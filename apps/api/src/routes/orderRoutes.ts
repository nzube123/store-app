import { Router, type IRouter } from 'express';
import { getOrderController, listOrdersController } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const orderRouter: IRouter = Router();
orderRouter.use(requireAuth);
orderRouter.get('/', listOrdersController);
orderRouter.get('/:id', getOrderController);
