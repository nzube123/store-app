import { Router, type IRouter } from 'express';
import { getCategoriesController, getProductController, getProductsByIdsController, listProductsController } from '../controllers/productController.js';

export const productRouter: IRouter = Router();
productRouter.get('/', listProductsController);
productRouter.get('/categories', getCategoriesController);
productRouter.get('/lookup', getProductsByIdsController);
productRouter.get('/:slug', getProductController);
