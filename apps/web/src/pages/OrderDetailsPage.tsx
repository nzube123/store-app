import { ArrowLeft, Check, PackageCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, Loading } from '../components/Status';
import { useOrder } from '../hooks/useShopQueries';
import { formatPrice } from '../lib/format';

export function OrderDetailsPage() {
  const { id = '' } = useParams();
  const { data: order, isPending, isError, refetch } = useOrder(id);
  if (isPending) return <div className="page-container"><Loading label="Gathering your order…" /></div>;
  if (isError || !order) return <div className="page-container"><ErrorState message="We could not find that order." onRetry={() => void refetch()} /></div>;
  return <div className="page-container order-detail-page"><Link to="/orders" className="back-link"><ArrowLeft size={16} /> All orders</Link><div className="order-confirmation-banner"><span className="confirmation-icon"><Check size={22} /></span><p className="eyebrow">{order.paymentStatus === 'PAID' ? 'Safely in good hands' : 'Order update'}</p><h1>{order.paymentStatus === 'PAID' ? 'It’s official.' : 'Your order is on its way.'}</h1><p>{order.paymentStatus === 'PAID' ? 'Thank you for choosing pieces made with care. We’ll take it from here.' : `Payment is ${order.paymentStatus.toLowerCase()}.`}</p></div><div className="order-detail-meta"><div><span>Order number</span><strong>{order.id}</strong></div><div><span>Placed on</span><strong>{new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div><div><span>Payment</span><strong className={`status-pill status-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus.toLowerCase()}</strong></div><div><span>Order status</span><strong className="status-pill status-processing">{order.status.toLowerCase()}</strong></div></div><section className="order-detail-items"><h2><PackageCheck size={19} /> In this order</h2>{order.items.map((item) => <div className="order-item-line" key={item.id}><img src={item.productImage} alt={item.productName} /><span><strong>{item.productName}</strong><small>Qty {item.quantity} × {formatPrice(item.unitPrice)}</small></span><strong>{formatPrice(item.subtotal)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div></section></div>;
}
