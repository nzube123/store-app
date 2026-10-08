import type { RequestHandler } from 'express';
import { productQuerySchema } from '@shop/shared';
import { asyncHandler } from '../lib/asyncHandler.js';
import { getCategories, getProduct, getProductsByIds, listProducts } from '../services/productService.js';

export const listProductsController: RequestHandler = asyncHandler(async (request, response) => {
  const query = productQuerySchema.parse(request.query);
  response.json({ data: await listProducts(query) });
});

export const getProductController: RequestHandler = asyncHandler(async (request, response) => {
  const slug = request.params.slug;
  response.json({ data: await getProduct(typeof slug === 'string' ? slug : '') });
});

export const getCategoriesController: RequestHandler = asyncHandler(async (_request, response) => {
  response.json({ data: await getCategories() });
});

export const getProductsByIdsController: RequestHandler = asyncHandler(async (request, response) => {
  const ids = typeof request.query.ids === 'string' ? request.query.ids.split(',').filter(Boolean).slice(0, 30) : [];
  response.json({ data: await getProductsByIds([...new Set(ids)]) });
});
