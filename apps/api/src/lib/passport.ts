import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '@shop/database';
import { env } from '../config/env.js';
import { findOrCreateGoogleUser } from '../services/authService.js';

if (env.googleClientId && env.googleClientSecret) {
  passport.use('google', new GoogleStrategy({
    clientID: env.googleClientId,
    clientSecret: env.googleClientSecret,
    callbackURL: `${env.apiUrl}/api/auth/google/callback`,
    scope: ['profile', 'email'],
  }, (_accessToken, _refreshToken, profile, done) => {
    void findOrCreateGoogleUser(profile).then((user) => done(null, user)).catch((error: unknown) => done(error));
  }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id: string, done) => {
  void prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, image: true } })
    .then((user) => done(null, user ?? false)).catch((error: unknown) => done(error));
});

export { passport };
