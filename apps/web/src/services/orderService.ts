import type { OrderDto } from '@shop/shared';
import { apiRequest } from './api';

export const getOrders = (): Promise<OrderDto[]> => apiRequest('/orders');
export const getOrder = (id: string): Promise<OrderDto> => apiRequest(`/orders/${encodeURIComponent(id)}`);
