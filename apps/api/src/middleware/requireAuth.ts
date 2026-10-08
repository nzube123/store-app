import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  if (!request.user) {
    next(new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED'));
    return;
  }
  next();
}
