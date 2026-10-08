import { randomUUID } from 'node:crypto';
import { OrderStatus, PaymentStatus, Prisma, prisma } from '@shop/database';
import type { CheckoutInput, OrderDto, UserDto } from '@shop/shared';
import { AppError } from '../lib/errors.js';
import { amountToCents, centsToAmount } from '../lib/money.js';
import { sendOrderConfirmation } from './emailService.js';
import { initializePayment, verifyPayment } from './paymentService.js';
import { orderInclude, toOrderDto } from './orderService.js';

export function calculateTotalCents(lines: ReadonlyArray<{ unitPrice: string; quantity: number }>): bigint {
  return lines.reduce((total, line) => total + amountToCents(line.unitPrice) * BigInt(line.quantity), 0n);
}

function assertTransactionDetails(
  transaction: { status: string; reference: string; amount: number; currency: string; customer: { email: string } },
  expected: { reference: string; amountKobo: number; email: string },
): void {
  if (transaction.reference !== expected.reference ||
      transaction.amount !== expected.amountKobo || transaction.currency !== 'NGN' ||
      transaction.customer.email.toLowerCase() !== expected.email.toLowerCase()) {
    throw new AppError('The payment details could not be verified.', 400, 'PAYMENT_MISMATCH');
  }
}

export function assertVerifiedTransaction(
  transaction: { status: string; reference: string; amount: number; currency: string; customer: { email: string } },
  expected: { reference: string; amountKobo: number; email: string },
): void {
  assertTransactionDetails(transaction, expected);
  if (transaction.status !== 'success') throw new AppError('The payment has not completed.', 402, 'PAYMENT_NOT_COMPLETE');
}

export async function createCheckout(user: UserDto, input: CheckoutInput) {
  const existing = await prisma.order.findUnique({
    where: { userId_idempotencyKey: { userId: user.id, idempotencyKey: input.idempotencyKey } },
    include: orderInclude,
  });
  if (existing) {
    if (!existing.paymentRef || !existing.authorizationUrl || existing.paymentStatus !== PaymentStatus.PENDING) {
      throw new AppError('This checkout request was already used.', 409, 'IDEMPOTENCY_CONFLICT');
    }
    return { order: toOrderDto(existing), authorizationUrl: existing.authorizationUrl, reference: existing.paymentRef };
  }

  const ids = input.items.map(({ productId }) => productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  if (products.length !== ids.length) throw new AppError('One or more products are no longer available.', 400, 'PRODUCT_UNAVAILABLE');
  const byId = new Map(products.map((product) => [product.id, product]));
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw new AppError('One or more products are no longer available.', 400, 'PRODUCT_UNAVAILABLE');
    if (product.stock < item.quantity) throw new AppError(`${product.name} does not have enough stock.`, 409, 'INSUFFICIENT_STOCK');
  }

  const lines = input.items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new AppError('One or more products are no longer available.', 400, 'PRODUCT_UNAVAILABLE');
    const unitPrice = product.price.toFixed(2);
    return { product, quantity: item.quantity, unitPrice, subtotal: centsToAmount(amountToCents(unitPrice) * BigInt(item.quantity)) };
  });
  const totalCents = calculateTotalCents(lines);
  const reference = `cl_${randomUUID().replaceAll('-', '')}`;

  let createdOrder: { id: string; total: Prisma.Decimal };
  try {
    createdOrder = await prisma.$transaction(async (transaction) => {
      for (const line of lines) {
        const reserved = await transaction.product.updateMany({
          where: { id: line.product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (reserved.count !== 1) throw new AppError(`${line.product.name} just sold out.`, 409, 'INSUFFICIENT_STOCK');
      }
      const order = await transaction.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          total: new Prisma.Decimal(centsToAmount(totalCents)),
          paymentRef: reference,
          idempotencyKey: input.idempotencyKey,
          items: { create: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity, unitPrice: line.unitPrice, subtotal: line.subtotal })) },
        },
      });
      return { id: order.id, total: order.total };
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.order.findUnique({ where: { userId_idempotencyKey: { userId: user.id, idempotencyKey: input.idempotencyKey } }, include: orderInclude });
      if (duplicate?.authorizationUrl && duplicate.paymentRef) {
        return { order: toOrderDto(duplicate), authorizationUrl: duplicate.authorizationUrl, reference: duplicate.paymentRef };
      }
      throw new AppError('This checkout is already being processed. Please retry shortly.', 409, 'CHECKOUT_IN_PROGRESS');
    }
    throw error;
  }

  try {
    const initialized = await initializePayment({ email: user.email, amountKobo: Number(totalCents), reference, orderId: createdOrder.id });
    const order = await prisma.order.update({ where: { id: createdOrder.id }, data: { authorizationUrl: initialized.authorizationUrl }, include: orderInclude });
    return { order: toOrderDto(order), authorizationUrl: initialized.authorizationUrl, reference };
  } catch (error: unknown) {
    await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({ where: { id: createdOrder.id }, select: { paymentStatus: true } });
      if (order?.paymentStatus !== PaymentStatus.PENDING) return;
      for (const line of lines) {
        await transaction.product.update({ where: { id: line.product.id }, data: { stock: { increment: line.quantity } } });
      }
      await transaction.order.update({ where: { id: createdOrder.id }, data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED } });
    });
    throw error;
  }
}

export async function completePayment(user: UserDto, reference: string): Promise<OrderDto> {
  const order = await prisma.order.findFirst({ where: { paymentRef: reference, userId: user.id }, include: orderInclude });
  if (!order) throw new AppError('That payment could not be found.', 404, 'PAYMENT_NOT_FOUND');
  if (order.paymentStatus === PaymentStatus.PAID) return toOrderDto(order);

  const transaction = await verifyPayment(reference);
  const totalCents = amountToCents(order.total.toFixed(2));
  const expected = { reference: order.paymentRef ?? '', amountKobo: Number(totalCents), email: user.email };
  assertTransactionDetails(transaction, expected);

  if (transaction.status !== 'success') {
    if (transaction.status === 'failed' || transaction.status === 'abandoned') {
      await prisma.$transaction(async (tx) => {
        const cancelled = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: PaymentStatus.PENDING, status: OrderStatus.PENDING },
          data: { paymentStatus: PaymentStatus.FAILED, status: OrderStatus.CANCELLED },
        });
        if (cancelled.count === 1) {
          for (const item of order.items) {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          }
        }
      });
      throw new AppError('The payment did not complete. You can return to your bag and try again.', 402, 'PAYMENT_FAILED');
    }
    throw new AppError('The payment is still being processed. Please try again shortly.', 409, 'PAYMENT_PENDING');
  }

  const completion = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: PaymentStatus.PENDING, status: OrderStatus.PENDING },
      data: { paymentStatus: PaymentStatus.PAID, status: OrderStatus.PROCESSING },
    });
    const paidOrder = await tx.order.findUnique({ where: { id: order.id }, include: orderInclude });
    return { order: paidOrder, newlyPaid: changed.count === 1 };
  });
  if (!completion.order) throw new AppError('The order could not be loaded.', 500, 'ORDER_UPDATE_FAILED');
  if (!completion.newlyPaid) return toOrderDto(completion.order);
  const updated = completion.order;
  const dto = toOrderDto(updated);
  try {
    const sent = await sendOrderConfirmation(user, dto);
    if (sent) await prisma.order.update({ where: { id: order.id }, data: { emailSentAt: new Date() } });
  } catch (error: unknown) {
    console.error(`Order confirmation email failed for ${order.id}:`, error);
  }
  return dto;
}
