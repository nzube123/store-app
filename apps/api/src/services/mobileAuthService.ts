import { createHash, randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@shop/database';
import type { UserDto } from '@shop/shared';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { findOrCreateGoogleUserFromIdentity } from './authService.js';

const mobileSessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const googleAuthClient = new OAuth2Client();

function hashMobileToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function authenticateGoogleMobile(idToken: string) {
  const audiences = [env.googleClientId, ...env.googleMobileClientIds]
    .filter((clientId): clientId is string => Boolean(clientId));
  if (audiences.length === 0) {
    throw new AppError('Google sign-in is not configured yet.', 503, 'AUTH_UNAVAILABLE');
  }

  let payload;
  try {
    const ticket = await googleAuthClient.verifyIdToken({ idToken, audience: audiences });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('The Google credential is invalid or expired.', 401, 'INVALID_GOOGLE_CREDENTIAL');
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new AppError('The Google credential is invalid or expired.', 401, 'INVALID_GOOGLE_CREDENTIAL');
  }

  const user = await findOrCreateGoogleUserFromIdentity({
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0] || 'Cedar & Loom customer',
    image: payload.picture ?? null,
  });
  const accessToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + mobileSessionLifetimeMs);

  await prisma.session.create({
    data: {
      sid: hashMobileToken(accessToken),
      userId: user.id,
      data: { type: 'mobile' },
      expiresAt,
    },
  });

  return { user, accessToken, expiresAt: expiresAt.toISOString() };
}

export async function getMobileUserFromToken(token: string): Promise<UserDto | null> {
  const storedSession = await prisma.session.findUnique({
    where: { sid: hashMobileToken(token) },
    include: { user: { select: { id: true, email: true, name: true, image: true } } },
  });
  if (!storedSession || storedSession.expiresAt <= new Date()) return null;
  return storedSession.user;
}
