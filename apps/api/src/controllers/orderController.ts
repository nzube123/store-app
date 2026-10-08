import type { RequestHandler } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { getOrder, listOrders } from '../services/orderService.js';

export const listOrdersController: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.user) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
  response.json({ data: await listOrders(request.user.id) });
});

export const getOrderController: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.user) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
  const orderId = request.params.id;
  response.json({ data: await getOrder(request.user.id, typeof orderId === 'string' ? orderId : '') });
});
