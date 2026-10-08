import type { ProductDto, ProductQuery } from '@shop/shared';
import { apiRequest } from './api';

export interface ProductPage {
  items: ProductDto[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const getProducts = (query: Partial<ProductQuery> = {}): Promise<ProductPage> => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
  return apiRequest(`/products?${params.toString()}`);
};

export const getProduct = (slug: string): Promise<ProductDto> => apiRequest(`/products/${encodeURIComponent(slug)}`);
export const getCategories = (): Promise<string[]> => apiRequest('/products/categories');
export const getProductsByIds = (ids: string[]): Promise<ProductDto[]> => ids.length ? apiRequest(`/products/lookup?ids=${encodeURIComponent(ids.join(','))}`) : Promise.resolve([]);
