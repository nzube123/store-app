import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CircleCheck, LoaderCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../services/checkoutService';
import { useCart } from '../stores/CartStore';

export function PaymentReturnPage() {
  const [params] = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref') ?? '';
  const { clear } = useCart();
  const queryClient = useQueryClient();
  const started = useRef(false);
  const verification = useMutation({
    mutationFn: () => verifyPayment(reference),
    onSuccess: async ({ order }) => {
      clear();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.setQueryData(['order', order.id], order);
    },
  });
  useEffect(() => {
    if (reference && !started.current) {
      started.current = true;
      verification.mutate();
    }
  }, [reference]);
  if (!reference) return <div className="payment-result"><p className="eyebrow">Payment return</p><h1>No reference <em>found.</em></h1><p>We could not find a payment reference in this link.</p><Link className="button button-dark" to="/orders">See your orders <ArrowRight size={16} /></Link></div>;
  if (verification.isPending || verification.isIdle) return <div className="payment-result"><LoaderCircle className="spin" size={28} /><p className="eyebrow">One last thing</p><h1>Verifying your <em>payment.</em></h1><p>Please keep this window open while we confirm everything securely.</p></div>;
  if (verification.isError) return <div className="payment-result"><p className="eyebrow">Almost there</p><h1>We’re checking <em>things over.</em></h1><p>{verification.error.message} Your order is safe to retry verification.</p><button className="button button-dark" onClick={() => verification.mutate()}>Try verification again <ArrowRight size={16} /></button></div>;
  return <div className="payment-result"><CircleCheck className="payment-success-icon" size={34} /><p className="eyebrow">Payment confirmed</p><h1>Thank you, <em>truly.</em></h1><p>Your order is in good hands now.</p><Link className="button button-dark" to={`/orders/${verification.data.order.id}`}>View your order <ArrowRight size={16} /></Link></div>;
}
