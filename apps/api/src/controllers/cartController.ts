import type { RequestHandler } from 'express';
import { cartItemsSchema } from '@shop/shared';
import { prisma } from '@shop/database';
import { asyncHandler } from '../lib/asyncHandler.js';

export const validateCartController: RequestHandler = asyncHandler(async (request, response) => {
  const items = cartItemsSchema.parse(request.body);
  const products = await prisma.product.findMany({ where: { id: { in: items.map((item) => item.productId) } } });
  const byId = new Map(products.map((product) => [product.id, product]));
  const result = items.map((item) => {
    const product = byId.get(item.productId);
    return {
      productId: item.productId,
      available: Boolean(product && product.stock >= item.quantity),
      ...(product ? { currentPrice: Number(product.price), stock: product.stock } : {}),
    };
  });
  response.json({ data: result });
});
