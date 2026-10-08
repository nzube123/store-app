import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useShopQueries';
import { formatPrice } from '../lib/format';
import { useCart } from '../stores/CartStore';
import { useToast } from '../components/Toast';
import { ErrorState, Loading } from '../components/Status';
import { useState } from 'react';

export function ProductDetailsPage() {
  const { slug = '' } = useParams();
  const { data: product, isPending, isError, refetch } = useProduct(slug);
  const { add } = useCart();
  const { notify } = useToast();
  const [quantity, setQuantity] = useState(1);
  if (isPending) return <Loading />;
  if (isError || !product) return <div className="page-container"><ErrorState message="This piece is not available right now." onRetry={() => void refetch()} /></div>;
  const available = product.stock > 0;
  return <div className="page-container product-detail-page"><Link className="back-link" to="/products"><ArrowLeft size={16} /> Back to the collection</Link><div className="product-detail"><div className="detail-image"><img src={product.image} alt={product.name} /></div><div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="detail-price">{formatPrice(product.price)}</p><p className="detail-description">{product.description}</p><div className="detail-rule" /><div className="detail-stock"><Check size={16} /> {available ? `${product.stock} in stock · ready to find a home` : 'Currently out of stock'}</div><div className="purchase-row"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><span>{quantity}</span><button aria-label="Increase quantity" disabled={!available || quantity >= Math.min(20, product.stock)} onClick={() => setQuantity((value) => Math.min(Math.min(20, product.stock), value + 1))}><Plus size={15} /></button></div><button className="button button-dark add-button" disabled={!available} onClick={() => { for (let index = 0; index < quantity; index += 1) add(product.id); notify(`${product.name} added to your bag.`); }}>Add to bag <ArrowRight size={17} /></button></div><div className="detail-note"><ShieldCheck size={18} /><span>Thoughtfully packed and delivered to your door.</span></div><Link to="/cart" className="text-link detail-cart-link">Go to your bag <ArrowRight size={15} /></Link></div></div></div>;
}
