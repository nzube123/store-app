import type { Request, RequestHandler } from 'express';
import { AppError } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { getMobileUserFromToken } from '../services/mobileAuthService.js';

async function authenticateBearer(request: Request): Promise<void> {
  const authorization = request.get('authorization');
  if (!authorization) return;

  const match = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(authorization);
  if (!match) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');

  const token = match[1];
  if (!token) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');

  const user = await getMobileUserFromToken(token);
  if (!user) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
  request.user = user;
}

export const authenticateOptional: RequestHandler = asyncHandler(async (request, _response, next) => {
  if (!request.user) await authenticateBearer(request);
  next();
});

export const requireAuth: RequestHandler = asyncHandler(async (request, _response, next) => {
  if (!request.user) await authenticateBearer(request);
  if (!request.user) {
    throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
  }
  next();
});
