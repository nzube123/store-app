import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: { message: 'Please check the submitted information.', code: 'VALIDATION_ERROR', details: error.flatten() } });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
    return;
  }
  console.error('Unhandled request error:', error);
  response.status(500).json({ error: { message: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' } });
};
