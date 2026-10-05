import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const db = vi.hoisted(() => ({ productFindMany: vi.fn(), productCount: vi.fn(), orderFindFirst: vi.fn() }));
vi.mock('@shop/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shop/database')>();
  return { ...actual, prisma: { product: { findMany: db.productFindMany, count: db.productCount }, order: { findFirst: db.orderFindFirst } } };
});

import { Prisma } from '@shop/database';
import { app } from './app.js';
import { getOrder } from './services/orderService.js';

beforeEach(() => {
  db.productFindMany.mockReset();
  db.productCount.mockReset();
  db.orderFindFirst.mockReset();
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
