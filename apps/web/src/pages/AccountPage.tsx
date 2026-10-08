import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LogOut, Package, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState, Loading } from '../components/Status';
import { useToast } from '../components/Toast';
import { useCurrentUser, useOrders } from '../hooks/useShopQueries';
import { logout } from '../services/authService';
import { formatPrice } from '../lib/format';

export function AccountPage() {
  const { data: user, isPending, isError, refetch } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { notify } = useToast();
  const signOut = useMutation({ mutationFn: logout, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['current-user'] }); await queryClient.setQueryData(['current-user'], null); notify('You have signed out.'); navigate('/'); } });
  const orders = useOrders(Boolean(user));
  if (isPending || orders.isPending) return <div className="page-container"><Loading label="Opening your account…" /></div>;
  if (isError || !user) return <div className="page-container"><ErrorState message="We could not open your account." onRetry={() => void refetch()} /></div>;
  return <div className="page-container account-page"><div className="page-intro account-intro"><p className="eyebrow">Your corner</p><h1>Welcome back,<br /><em>{user.name.split(' ')[0]}.</em></h1><p>Good to have you here. Here’s what’s happening with your orders.</p></div><div className="account-grid"><section className="account-card account-profile"><span className="account-card-icon"><UserRound size={21} /></span><p className="eyebrow">Your details</p><h2>{user.name}</h2><p>{user.email}</p><button className="text-button" onClick={() => signOut.mutate()} disabled={signOut.isPending}><LogOut size={15} /> {signOut.isPending ? 'Signing out…' : 'Sign out'}</button></section><section className="account-card"><span className="account-card-icon"><Package size={21} /></span><p className="eyebrow">A little history</p><h2>{orders.data?.length ?? 0} orders</h2><p>{orders.data?.length ? `Your most recent order was ${new Date(orders.data[0]?.createdAt ?? '').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'Your order history will find a home here.'}</p><Link className="text-link" to="/orders">View all orders <ArrowRight size={15} /></Link></section></div><section className="account-latest"><div className="section-heading"><div><p className="eyebrow">Recently gathered</p><h2>Latest orders</h2></div><Link className="text-link" to="/orders">See all <ArrowRight size={15} /></Link></div>{orders.data?.slice(0, 2).map((order) => <Link className="order-row" key={order.id} to={`/orders/${order.id}`}><span className="order-row-icon"><Package size={18} /></span><span><strong>Order {order.id.slice(-8).toUpperCase()}</strong><small>{new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.items.length} pieces</small></span><span className={`status-pill status-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus.toLowerCase()}</span><strong>{formatPrice(order.total)}</strong><ArrowRight size={16} /></Link>)}</section></div>;
}
