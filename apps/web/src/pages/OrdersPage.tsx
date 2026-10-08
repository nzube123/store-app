import { ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/Status';
import { useCurrentUser, useOrders } from '../hooks/useShopQueries';
import { formatPrice } from '../lib/format';

export function OrdersPage() {
  const { data: user, isPending: userPending } = useCurrentUser();
  const orders = useOrders(Boolean(user));
  if (userPending || orders.isPending) return <div className="page-container"><Loading label="Finding your orders…" /></div>;
  if (orders.isError) return <div className="page-container"><ErrorState onRetry={() => void orders.refetch()} /></div>;
  return <div className="page-container orders-page"><div className="page-intro"><p className="eyebrow">The things you chose</p><h1>Your <em>orders.</em></h1><p>Every good thing, all in one place.</p></div>{orders.data?.length ? <div className="orders-list">{orders.data.map((order) => <Link className="order-row" key={order.id} to={`/orders/${order.id}`}><span className="order-row-icon"><Package size={18} /></span><span className="order-row-detail"><strong>Order {order.id.slice(-8).toUpperCase()}</strong><small>{new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces</small></span><span className={`status-pill status-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus.toLowerCase()}</span><strong>{formatPrice(order.total)}</strong><ArrowRight size={16} /></Link>)}</div> : <EmptyState title="Your story starts here" message="Orders you place will appear here, ready whenever you need them." action={<Link className="button button-dark" to="/products">Find something good <ArrowRight size={16} /></Link>} />}</div>;
}
