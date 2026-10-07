import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type * as DatabaseModule from '@shop/database';
import type * as AppEnvModule from './config/env.js';

const db = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  productCount: vi.fn(),
  orderFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  userUpsert: vi.fn(),
  oauthAccountFindUnique: vi.fn(),
  oauthAccountCreate: vi.fn(),
  sessionCreate: vi.fn(),
  sessionFindUnique: vi.fn(),
  orderFindMany: vi.fn(),
}));
vi.mock('@shop/database', async (importOriginal) => {
  const actual = await importOriginal<typeof DatabaseModule>();
  const user = { findUnique: db.userFindUnique, upsert: db.userUpsert };
  const oAuthAccount = { findUnique: db.oauthAccountFindUnique, create: db.oauthAccountCreate };
  const session = { create: db.sessionCreate, findUnique: db.sessionFindUnique };
  return {
    ...actual,
    prisma: {
      product: { findMany: db.productFindMany, count: db.productCount },
      order: { findFirst: db.orderFindFirst, findMany: db.orderFindMany },
      user,
      oAuthAccount,
      session,
      $transaction: (callback: (transaction: { user: typeof user; oAuthAccount: typeof oAuthAccount }) => unknown) => callback({ user, oAuthAccount }),
    },
  };
});

const google = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = google.verifyIdToken;
  },
}));
vi.mock('./config/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof AppEnvModule>();
  return {
    ...actual,
    env: {
      ...actual.env,
      googleClientId: 'test-google-client-id',
      googleMobileClientIds: ['test-mobile-client-id'],
    },
  };
});

import { Prisma } from '@shop/database';
import { app } from './app.js';
import { getOrder } from './services/orderService.js';

beforeEach(() => {
  db.productFindMany.mockReset();
  db.productCount.mockReset();
  db.orderFindFirst.mockReset();
  db.userFindUnique.mockReset();
  db.userUpsert.mockReset();
  db.oauthAccountFindUnique.mockReset();
  db.oauthAccountCreate.mockReset();
  db.sessionCreate.mockReset();
  db.sessionFindUnique.mockReset();
  db.orderFindMany.mockReset();
  google.verifyIdToken.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe('shop API routes', () => {
  it('retrieves database products with pagination and money-safe serialization', async () => {
    db.productFindMany.mockResolvedValue([{
      id: 'p-1', slug: 'arc-vase', name: 'Arc Vase', description: 'A handmade vase',
      price: new Prisma.Decimal('68000.00'), image: 'https://images.example/vase.jpg', category: 'Decor', stock: 4,
      createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);
    db.productCount.mockResolvedValue(1);
    const response = await request(app).get('/api/products?category=Decor&page=1&limit=12');

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).toMatchObject({ id: 'p-1', name: 'Arc Vase', price: 68000 });
    expect(response.body.data.pagination).toMatchObject({ page: 1, total: 1, pages: 1 });
  });

  it('allows the deployed frontend origin and rejects unlisted origins', async () => {
    const allowedResponse = await request(app)
      .get('/api/health')
      .set('Origin', 'https://store-app-mauve-ten.vercel.app');
    const rejectedResponse = await request(app)
      .get('/api/health')
      .set('Origin', 'https://unlisted.example');

    expect(allowedResponse.headers['access-control-allow-origin']).toBe('https://store-app-mauve-ten.vercel.app');
    expect(allowedResponse.headers['access-control-allow-credentials']).toBe('true');
    expect(rejectedResponse.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('protects private order routes with authentication', async () => {
    const response = await request(app).get('/api/orders');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('exchanges a verified Google ID token for a mobile token and authenticates protected requests', async () => {
    const user = { id: 'user-mobile', email: 'mobile@example.com', name: 'Mobile User', image: null };
    db.oauthAccountFindUnique.mockResolvedValue(null);
    db.userUpsert.mockResolvedValue(user);
    db.oauthAccountCreate.mockResolvedValue({});
    db.sessionCreate.mockResolvedValue({});
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-mobile-1',
        email: user.email,
        email_verified: true,
        name: user.name,
      }),
    });
    db.sessionFindUnique.mockImplementation(async ({ where }) => (
      where.sid ? { expiresAt: new Date(Date.now() + 60_000), user } : null
    ));
    db.orderFindMany.mockResolvedValue([]);

    const login = await request(app)
      .post('/api/auth/google/mobile')
      .send({ idToken: 'verified-google-id-token' });

    expect(login.status).toBe(200);
    expect(login.body.data.user).toEqual(user);
    expect(login.body.data.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(login.body.data.expiresAt).toBeDefined();
    expect(db.userUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: user.email },
      create: { email: user.email, name: user.name, image: null },
    }));
    expect(db.oauthAccountCreate).toHaveBeenCalledWith({
      data: { provider: 'google', providerAccountId: 'google-mobile-1', userId: user.id },
    });
    expect(db.sessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: user.id, data: { type: 'mobile' } }),
    }));
    expect(google.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'verified-google-id-token',
      audience: ['test-google-client-id', 'test-mobile-client-id'],
    });

    const protectedResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(protectedResponse.status).toBe(200);
  });

  it.each([
    ['invalid', new Error('Invalid token')],
    ['expired', new Error('Token used too late')],
    ['wrong audience', new Error('Wrong recipient, payload audience does not match')],
  ])('rejects a %s Google ID token without creating an account or token', async (_reason, error) => {
    google.verifyIdToken.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/auth/google/mobile')
      .send({ idToken: 'invalid-google-id-token' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_GOOGLE_CREDENTIAL');
    expect(db.userUpsert).not.toHaveBeenCalled();
    expect(db.sessionCreate).not.toHaveBeenCalled();
  });

  it('requires an ID token in the mobile Google authentication request', async () => {
    const response = await request(app)
      .post('/api/auth/google/mobile')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(google.verifyIdToken).not.toHaveBeenCalled();
  });

  it('uses the existing linked Google account instead of creating a duplicate user', async () => {
    const user = { id: 'user-existing', email: 'existing@example.com', name: 'Existing User', image: null };
    db.oauthAccountFindUnique.mockResolvedValue({ user });
    db.sessionCreate.mockResolvedValue({});
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-existing',
        email: user.email,
        email_verified: true,
        name: user.name,
      }),
    });

    const response = await request(app)
      .post('/api/auth/google/mobile')
      .send({ idToken: 'valid-existing-user-token' });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
    expect(db.userUpsert).not.toHaveBeenCalled();
    expect(db.oauthAccountCreate).not.toHaveBeenCalled();
  });

  it('returns the already-linked user when concurrent Google account creation hits a unique constraint', async () => {
    const user = { id: 'user-existing', email: 'existing@example.com', name: 'Existing User', image: null };
    db.oauthAccountFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ user });
    db.userUpsert.mockResolvedValue(user);
    db.oauthAccountCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    ));
    db.sessionCreate.mockResolvedValue({});
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-existing',
        email: user.email,
        email_verified: true,
        name: user.name,
      }),
    });

    const response = await request(app)
      .post('/api/auth/google/mobile')
      .send({ idToken: 'valid-concurrent-user-token' });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
    expect(db.oauthAccountFindUnique).toHaveBeenCalledTimes(2);
  });

  it('rejects expired mobile credentials on protected endpoints', async () => {
    db.sessionFindUnique.mockResolvedValue({ expiresAt: new Date(Date.now() - 1), user: null });

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${'a'.repeat(43)}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects unverified Google email claims and client-supplied identity fields', async () => {
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-unverified',
        email: 'unverified@example.com',
        email_verified: false,
      }),
    });

    const unverified = await request(app)
      .post('/api/auth/google/mobile')
      .send({ idToken: 'valid-signature-unverified-email' });
    const clientIdentity = await request(app)
      .post('/api/auth/google/mobile')
      .send({ idToken: 'valid-token', email: 'attacker@example.com', name: 'Attacker' });

    expect(unverified.status).toBe(401);
    expect(unverified.body.error.code).toBe('INVALID_GOOGLE_CREDENTIAL');
    expect(clientIdentity.status).toBe(400);
    expect(db.userUpsert).not.toHaveBeenCalled();
  });

  it('enforces order ownership by including the signed-in user in the database lookup', async () => {
    db.orderFindFirst.mockResolvedValue(null);
    await expect(getOrder('user-a', 'order-owned-by-b')).rejects.toMatchObject({ statusCode: 404, code: 'ORDER_NOT_FOUND' });
    expect(db.orderFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'order-owned-by-b', userId: 'user-a' },
    }));
  });

  it('returns a useful 404 for unknown API paths', async () => {
    const response = await request(app).get('/api/not-a-route');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
