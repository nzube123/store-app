import { Router, type IRouter } from 'express';
import { authRouter } from './authRoutes.js';
import { cartRouter } from './cartRoutes.js';
import { checkoutRouter } from './checkoutRoutes.js';
import { orderRouter } from './orderRoutes.js';
import { productRouter } from './productRoutes.js';

export const apiRouter: IRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/checkout', checkoutRouter);
apiRouter.use('/payments', checkoutRouter);
apiRouter.use('/orders', orderRouter);
