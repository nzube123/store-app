import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  productUpdateMany: vi.fn(),
  productUpdate: vi.fn(),
  orderFindUnique: vi.fn(),
  orderCreate: vi.fn(),
  orderUpdate: vi.fn(),
  orderUpdateMany: vi.fn(),
  transaction: vi.fn(),
  initializePayment: vi.fn(),
  verifyPayment: vi.fn(),
}));

import type * as DatabaseModule from '@shop/database';

vi.mock('@shop/database', async (importOriginal) => {
  const actual = await importOriginal<typeof DatabaseModule>();
  return {
    ...actual,
    prisma: {
      product: { findMany: mocks.productFindMany, updateMany: mocks.productUpdateMany, update: mocks.productUpdate },
      order: { findUnique: mocks.orderFindUnique, create: mocks.orderCreate, update: mocks.orderUpdate, updateMany: mocks.orderUpdateMany },
      $transaction: mocks.transaction,
    },
  };
});
vi.mock('./paymentService.js', () => ({ initializePayment: mocks.initializePayment, verifyPayment: mocks.verifyPayment }));

import { Prisma, PaymentStatus, OrderStatus } from '@shop/database';
import { checkoutSchema } from '@shop/shared';
import type { UserDto } from '@shop/shared';
import { assertVerifiedTransaction, calculateTotalCents, createCheckout } from './checkoutService.js';

const user: UserDto = { id: 'user-1', email: 'shopper@example.com', name: 'Ayo Shopper', image: null };
const product = {
  id: 'product-1', slug: 'ceramic-mug', name: 'Ceramic Mug', description: 'Handmade mug',
  price: new Prisma.Decimal('32000.00'), image: 'https://images.example/mug.jpg', category: 'Tableware', stock: 6,
  createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
const orderResult = {
  id: 'order-1', userId: user.id, status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING,
  total: new Prisma.Decimal('32000.00'), paymentRef: 'cl_reference123456', authorizationUrl: null,
  idempotencyKey: '79d5f294-1a57-4aca-817e-a1a32675e880', createdAt: new Date('2026-01-01T00:00:00.000Z'),
  items: [{ id: 'item-1', productId: product.id, quantity: 1, unitPrice: product.price, subtotal: product.price, product: { name: product.name, image: product.image } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.orderFindUnique.mockResolvedValue(null);
  mocks.productFindMany.mockResolvedValue([product]);
  mocks.productUpdateMany.mockResolvedValue({ count: 1 });
  mocks.orderCreate.mockResolvedValue({ id: orderResult.id, total: orderResult.total });
  mocks.orderUpdate.mockResolvedValue({ ...orderResult, authorizationUrl: 'https://checkout.paystack.com/example' });
  mocks.initializePayment.mockResolvedValue({ authorizationUrl: 'https://checkout.paystack.com/example', reference: orderResult.paymentRef });
  mocks.transaction.mockImplementation((callback) => callback({
    product: { updateMany: mocks.productUpdateMany, update: mocks.productUpdate },
    order: { create: mocks.orderCreate, updateMany: mocks.orderUpdateMany, findUnique: mocks.orderFindUnique },
  }));
});

describe('checkout business rules', () => {
  it('calculates totals with integer minor units', () => {
    expect(calculateTotalCents([{ unitPrice: '32000.10', quantity: 2 }, { unitPrice: '999.99', quantity: 1 }])).toBe(6_500_019n);
  });

  it('rejects duplicate products and invalid quantities at the shared boundary', () => {
    const parsed = checkoutSchema.safeParse({
      idempotencyKey: '79d5f294-1a57-4aca-817e-a1a32675e880',
      items: [{ productId: 'p1', quantity: 1 }, { productId: 'p1', quantity: 1 }],
    });
    expect(parsed.success).toBe(false);
    expect(checkoutSchema.safeParse({ idempotencyKey: 'not-a-uuid', items: [] }).success).toBe(false);
  });

  it('creates a reserved order using database prices and initializes Paystack', async () => {
    const input = { idempotencyKey: '79d5f294-1a57-4aca-817e-a1a32675e880', items: [{ productId: product.id, quantity: 1 }] };
    const result = await createCheckout(user, input);

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.productUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: product.id, stock: { gte: 1 } }, data: { stock: { decrement: 1 } },
    }));
    const orderData = mocks.orderCreate.mock.calls[0]?.[0].data;
    expect(orderData.total.toString()).toBe('32000');
    expect(orderData.items.create[0].unitPrice).toBe('32000.00');
    expect(mocks.initializePayment).toHaveBeenCalledWith(expect.objectContaining({ amountKobo: 3_200_000, email: user.email }));
    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/example');
    expect(result.order.total).toBe(32000);
  });

  it('rejects insufficient stock before reserving or initializing payment', async () => {
    mocks.productFindMany.mockResolvedValue([{ ...product, stock: 0 }]);
    await expect(createCheckout(user, { idempotencyKey: '79d5f294-1a57-4aca-817e-a1a32675e880', items: [{ productId: product.id, quantity: 1 }] }))
      .rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', statusCode: 409 });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.initializePayment).not.toHaveBeenCalled();
  });

  it('rejects a payment whose amount, currency, reference, email, or status differs', () => {
    const verified = { status: 'success', reference: 'cl_reference123456', amount: 3_200_000, currency: 'NGN', customer: { email: user.email } };
    expect(() => assertVerifiedTransaction(verified, { reference: verified.reference, amountKobo: verified.amount, email: user.email })).not.toThrow();
    expect(() => assertVerifiedTransaction({ ...verified, amount: 1 }, { reference: verified.reference, amountKobo: verified.amount, email: user.email })).toThrow();
    expect(() => assertVerifiedTransaction({ ...verified, currency: 'USD' }, { reference: verified.reference, amountKobo: verified.amount, email: user.email })).toThrow();
    expect(() => assertVerifiedTransaction({ ...verified, status: 'failed' }, { reference: verified.reference, amountKobo: verified.amount, email: user.email })).toThrow();
  });
});
