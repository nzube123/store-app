import type { ProductDto } from '@shop/shared';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: ProductDto[] }) {
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
