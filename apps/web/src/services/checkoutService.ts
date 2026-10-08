import type { OrderDto } from '@shop/shared';
import { apiRequest } from './api';

export interface CheckoutItem { productId: string; quantity: number }
export interface CheckoutResult { order: OrderDto; authorizationUrl: string; reference: string }
export const startCheckout = (items: CheckoutItem[], idempotencyKey: string): Promise<CheckoutResult> => apiRequest('/checkout', {
  method: 'POST',
  body: JSON.stringify({ items, idempotencyKey }),
});
export const verifyPayment = (reference: string): Promise<{ order: OrderDto }> => apiRequest('/payments/verify', {
  method: 'POST',
  body: JSON.stringify({ reference }),
});
