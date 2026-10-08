import { z } from 'zod';

export const productQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  sort: z.enum(['featured', 'price-asc', 'price-desc', 'newest']).default('featured'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export const cartItemsSchema = z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(30);

export const checkoutSchema = z.object({
  items: cartItemsSchema,
  idempotencyKey: z.string().uuid(),
}).superRefine(({ items }, ctx) => {
  const ids = items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: 'custom', path: ['items'], message: 'Each product may only appear once.' });
  }
});

export const paymentVerificationSchema = z.object({ reference: z.string().min(8).max(100) });

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PaymentVerificationInput = z.infer<typeof paymentVerificationSchema>;

export interface ProductDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  createdAt: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDto {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  total: number;
  createdAt: string;
  items: OrderItemDto[];
}
