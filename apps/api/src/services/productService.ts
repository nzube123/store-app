import { prisma } from '@shop/database';
import type { ProductQuery } from '@shop/shared';
import { AppError } from '../lib/errors.js';

export async function listProducts(query: ProductQuery) {
  const where = {
    ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { description: { contains: query.search, mode: 'insensitive' as const } }] } : {}),
    ...(query.category && query.category !== 'All' ? { category: query.category } : {}),
  };
  const orderBy = query.sort === 'price-asc'
    ? { price: 'asc' as const }
    : query.sort === 'price-desc'
      ? { price: 'desc' as const }
      : query.sort === 'newest'
        ? { createdAt: 'desc' as const }
        : { name: 'asc' as const };
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.product.count({ where }),
  ]);
  return {
    items: products.map((product) => ({ ...product, price: Number(product.price), createdAt: product.createdAt.toISOString() })),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  };
}

export async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) throw new AppError('We could not find that product.', 404, 'PRODUCT_NOT_FOUND');
  return { ...product, price: Number(product.price), createdAt: product.createdAt.toISOString() };
}

export async function getProductsByIds(ids: string[]) {
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  return products.map((product) => ({ ...product, price: Number(product.price), createdAt: product.createdAt.toISOString() }));
}

export async function getCategories(): Promise<string[]> {
  const categories = await prisma.product.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } });
  return categories.map(({ category }) => category);
}
