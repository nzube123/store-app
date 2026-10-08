import type { RequestHandler } from 'express';
import { checkoutSchema, paymentVerificationSchema } from '@shop/shared';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { completePayment, createCheckout } from '../services/checkoutService.js';

export const createCheckoutController: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.user) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
  const input = checkoutSchema.parse(request.body);
  const checkout = await createCheckout(request.user, input);
  response.status(201).json({ data: checkout });
});

export const verifyPaymentController: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.user) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
  const input = paymentVerificationSchema.parse(request.body);
  response.json({ data: { order: await completePayment(request.user, input.reference) } });
});
