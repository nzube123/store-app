import type { RequestHandler } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { passport } from '../lib/passport.js';
import { AppError } from '../lib/errors.js';

export const authStatusController: RequestHandler = (request, response) => {
  response.json({ data: { user: request.user ?? null, googleConfigured: Boolean(env.googleClientId && env.googleClientSecret) } });
};

export const googleLoginController: RequestHandler = (request, response, next) => {
  if (!env.googleClientId || !env.googleClientSecret) {
    next(new AppError('Google sign-in is not configured yet.', 503, 'AUTH_UNAVAILABLE'));
    return;
  }
  const state = randomBytes(32).toString('hex');
  request.session.oauthState = state;
  request.session.save((error: unknown) => {
    if (error) {
      next(error);
      return;
    }
    passport.authenticate('google', { scope: ['profile', 'email'], state })(request, response, next);
  });
};

export const googleCallbackController: RequestHandler = (request, response, next) => {
  const returnedState = request.query.state;
  const expectedState = request.session.oauthState;
  delete request.session.oauthState;
  if (typeof returnedState !== 'string' || !expectedState || returnedState.length !== expectedState.length ||
      !timingSafeEqual(Buffer.from(returnedState), Buffer.from(expectedState))) {
    response.redirect(`${env.frontendUrl}/login?error=oauth`);
    return;
  }
  passport.authenticate('google', { failureRedirect: `${env.frontendUrl}/login?error=oauth` }, (error: unknown, user: Express.User | false) => {
    if (error || !user) {
      response.redirect(`${env.frontendUrl}/login?error=oauth`);
      return;
    }
    request.logIn(user, (loginError: unknown) => {
      if (loginError) {
        next(loginError);
        return;
      }
      response.redirect(`${env.frontendUrl}/account`);
    });
  })(request, response, next);
};

export const logoutController: RequestHandler = (request, response, next) => {
  request.logout((error: unknown) => {
    if (error) {
      next(error);
      return;
    }
    request.session.destroy((sessionError: unknown) => {
      if (sessionError) {
        next(sessionError);
        return;
      }
      response.clearCookie('cedar.sid', { httpOnly: true, sameSite: 'lax', secure: env.isProduction });
      response.status(204).end();
    });
  });
};

export const meController: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: { user: request.user ?? null } });
});
