import { prisma } from '@shop/database';
import { AppError } from '../lib/errors.js';

export const orderInclude = { items: { include: { product: { select: { name: true, image: true } } } } } as const;

export function toOrderDto(order: Awaited<ReturnType<typeof prisma.order.findFirstOrThrow<{ include: typeof orderInclude }>>>) {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productImage: item.product.image,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function listOrders(userId: string) {
  const orders = await prisma.order.findMany({ where: { userId }, include: orderInclude, orderBy: { createdAt: 'desc' } });
  return orders.map(toOrderDto);
}

export async function getOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: orderInclude });
  if (!order) throw new AppError('That order could not be found.', 404, 'ORDER_NOT_FOUND');
  return toOrderDto(order);
}
