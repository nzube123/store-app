import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../services/authService';
import type { ProductQuery } from '@shop/shared';
import { getCategories, getProduct, getProducts, getProductsByIds } from '../services/productService';
import { getOrder, getOrders } from '../services/orderService';

export const useProducts = (filters: { search?: string; category?: string; sort?: ProductQuery['sort'] } = {}) => useQuery({
  queryKey: ['products', filters],
  queryFn: () => getProducts({ ...filters, limit: 48 }),
});
export const useProduct = (slug: string) => useQuery({ queryKey: ['product', slug], queryFn: () => getProduct(slug), enabled: Boolean(slug) });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: getCategories });
export const useCartProducts = (ids: string[]) => useQuery({ queryKey: ['cart-products', ids], queryFn: () => getProductsByIds(ids), enabled: ids.length > 0 });
export const useCurrentUser = () => useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: false });
export const useOrders = (enabled: boolean) => useQuery({ queryKey: ['orders'], queryFn: getOrders, enabled });
export const useOrder = (id: string) => useQuery({ queryKey: ['order', id], queryFn: () => getOrder(id), enabled: Boolean(id) });
