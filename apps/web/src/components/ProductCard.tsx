import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '@shop/shared';
import { formatPrice } from '../lib/format';

export function ProductCard({ product }: { product: ProductDto }) {
  return <article className="product-card">
    <Link className="product-image-wrap" to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
      <img src={product.image} alt={product.name} loading="lazy" />
      <span className="product-category">{product.category}</span>
      <span className="product-arrow"><ArrowUpRight size={17} /></span>
    </Link>
    <div className="product-card-info"><div><Link to={`/products/${product.slug}`} className="product-name">{product.name}</Link><p className="product-price">{formatPrice(product.price)}</p></div><span className={product.stock > 0 ? 'stock-note' : 'stock-note sold-out'}>{product.stock > 0 ? 'In stock' : 'Sold out'}</span></div>
  </article>;
}
