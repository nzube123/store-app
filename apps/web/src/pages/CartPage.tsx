import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../stores/CartStore';
import { useCartProducts } from '../hooks/useShopQueries';
import { formatPrice } from '../lib/format';
import { EmptyState, ErrorState, Loading } from '../components/Status';

export function CartPage() {
  const { items, setQuantity, remove } = useCart();
  const productsQuery = useCartProducts(items.map((item) => item.productId));
  if (!items.length) return <div className="page-container cart-page"><p className="eyebrow">Your bag</p><EmptyState title="A little space for something good" message="Your bag is waiting for its first thoughtful find." action={<Link to="/products" className="button button-dark">Explore the collection <ArrowRight size={16} /></Link>} /></div>;
  if (productsQuery.isPending) return <div className="page-container"><Loading label="Gathering your bag…" /></div>;
  if (productsQuery.isError) return <div className="page-container"><ErrorState onRetry={() => void productsQuery.refetch()} /></div>;
  const products = productsQuery.data ?? [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const subtotal = items.reduce((sum, item) => sum + (productMap.get(item.productId)?.price ?? 0) * item.quantity, 0);
  const hasUnavailable = items.some((item) => {
    const product = productMap.get(item.productId);
    return !product || product.stock < item.quantity;
  });
  return <div className="page-container cart-page"><div className="page-title-row"><div><p className="eyebrow">Your bag</p><h1>Good things, <em>gathered.</em></h1></div><span className="cart-count-label"><ShoppingBag size={17} /> {items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
    <div className="cart-layout"><section className="cart-items" aria-label="Items in your bag">{items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return <article className="cart-item" key={item.productId}><div className="cart-missing">This item is no longer available.</div><button className="remove-button" onClick={() => remove(item.productId)}>Remove</button></article>;
      const lowStock = product.stock < item.quantity;
      return <article className="cart-item" key={product.id}><Link to={`/products/${product.slug}`} className="cart-item-image"><img src={product.image} alt={product.name} /></Link><div className="cart-item-info"><p className="eyebrow">{product.category}</p><Link className="cart-item-name" to={`/products/${product.slug}`}>{product.name}</Link><span className="cart-item-unit">{formatPrice(product.price)} each</span>{lowStock && <span className="stock-warning">Only {product.stock} available — adjust your quantity.</span>}<div className="cart-item-controls"><div className="quantity-control small"><button aria-label={`Decrease ${product.name} quantity`} onClick={() => setQuantity(product.id, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={`Increase ${product.name} quantity`} disabled={item.quantity >= 20} onClick={() => setQuantity(product.id, item.quantity + 1)}><Plus size={13} /></button></div><button className="remove-button" onClick={() => remove(product.id)}><Trash2 size={14} /> Remove</button></div></div><strong className="cart-item-total">{formatPrice(product.price * item.quantity)}</strong></article>;
    })}</section>
      <aside className="cart-summary"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line"><span>Delivery</span><span>Complimentary</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div><p className="summary-note">Delivery is on us. No surprises at checkout.</p><Link className={`button button-dark checkout-button ${hasUnavailable ? 'button-disabled' : ''}`} to={hasUnavailable ? '#' : '/checkout'} onClick={(event) => { if (hasUnavailable) event.preventDefault(); }}>Continue to checkout <ArrowRight size={17} /></Link><Link className="continue-shopping" to="/products">Continue browsing</Link></aside>
    </div>
  </div>;
}
