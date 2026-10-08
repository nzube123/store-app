import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, EmptyState, Loading } from '../components/Status';
import { useToast } from '../components/Toast';
import { useCartProducts, useCurrentUser } from '../hooks/useShopQueries';
import { formatPrice } from '../lib/format';
import { startCheckout } from '../services/checkoutService';
import { useCart } from '../stores/CartStore';

export function CheckoutPage() {
  const { items } = useCart();
  const { data: user } = useCurrentUser();
  const productsQuery = useCartProducts(items.map((item) => item.productId));
  const { notify } = useToast();
  const requestKey = useRef(crypto.randomUUID());
  const checkout = useMutation({
    mutationFn: () => startCheckout(items, requestKey.current),
    onSuccess: ({ authorizationUrl }) => { window.location.assign(authorizationUrl); },
    onError: (error) => { requestKey.current = crypto.randomUUID(); notify(error instanceof Error ? error.message : 'Could not start checkout.', 'error'); },
  });
  if (!items.length) return <div className="page-container"><EmptyState title="Your bag is taking a breather" message="Add a piece or two before you head to checkout." action={<Link className="button button-dark" to="/products">Back to the collection <ArrowRight size={16} /></Link>} /></div>;
  if (productsQuery.isPending) return <div className="page-container"><Loading label="Preparing your checkout…" /></div>;
  if (productsQuery.isError) return <div className="page-container"><ErrorState onRetry={() => void productsQuery.refetch()} /></div>;
  const products = productsQuery.data ?? [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const subtotal = items.reduce((sum, item) => sum + (productMap.get(item.productId)?.price ?? 0) * item.quantity, 0);
  const unavailable = items.some((item) => !productMap.has(item.productId) || (productMap.get(item.productId)?.stock ?? 0) < item.quantity);
  return <div className="page-container checkout-page"><Link to="/cart" className="back-link"><ArrowLeft size={16} /> Back to bag</Link><div className="page-title-row"><div><p className="eyebrow">Almost yours</p><h1>Review & <em>continue.</em></h1></div><span className="secure-note"><LockKeyhole size={15} /> Secure checkout</span></div><div className="checkout-layout"><section className="checkout-main"><div className="checkout-panel"><span className="panel-number">01</span><div><h2>Contact</h2><p>{user?.name}</p><span>{user?.email}</span></div><Link className="text-link small-link" to="/account">Account</Link></div><div className="checkout-panel"><span className="panel-number">02</span><div><h2>Payment</h2><p>Pay securely with Paystack.</p><span>Your card details are handled by our payment partner.</span></div><ShieldCheck size={21} /></div><div className="checkout-reassurance"><ShieldCheck size={18} /><span>Your payment is verified securely before your order is confirmed. Prices and stock are checked again when you place your order.</span></div></section><aside className="cart-summary checkout-summary"><h2>In your bag <span>{items.length}</span></h2><div className="checkout-lines">{items.map((item) => { const product = productMap.get(item.productId); return product ? <div className="checkout-line" key={item.productId}><img src={product.image} alt="" /><span>{product.name}<small>Qty {item.quantity}</small></span><strong>{formatPrice(product.price * item.quantity)}</strong></div> : null; })}</div><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line"><span>Delivery</span><span>Complimentary</span></div><div className="summary-total"><span>Due today</span><strong>{formatPrice(subtotal)}</strong></div>{unavailable && <p className="stock-warning">An item has changed availability. Return to your bag to adjust it.</p>}<button className="button button-dark checkout-button" disabled={checkout.isPending || unavailable} onClick={() => checkout.mutate()}>{checkout.isPending ? 'Preparing secure payment…' : <>Continue to Paystack <ArrowRight size={17} /></>}</button>{checkout.isError && <p className="form-error" role="alert">{checkout.error.message}</p>}<p className="secure-footnote"><LockKeyhole size={13} /> Payments are processed securely by Paystack.</p></aside></div></div>;
}
