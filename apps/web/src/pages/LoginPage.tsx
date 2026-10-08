import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useShopQueries';
import { googleLoginUrl } from '../services/authService';
import { Loading } from '../components/Status';

export function LoginPage() {
  const { data: user, isPending } = useCurrentUser();
  const [params] = useSearchParams();
  const location = useLocation();
  if (isPending) return <Loading label="Checking your account…" />;
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/account'} replace />;
  return <div className="login-page"><div className="login-image"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1300&q=85" alt="Calm, sunlit home with natural textures" /><span>Make a little room for good things.</span></div><div className="login-panel"><Link to="/" className="back-link"><ArrowLeft size={16} /> Back to the shop</Link><div className="login-content"><span className="brand-mark login-mark">c.</span><p className="eyebrow">Welcome to your corner</p><h1>Good to have<br /><em>you here.</em></h1><p className="login-description">Sign in to keep track of your orders and the things you love.</p>{params.get('error') === 'oauth' && <p className="form-error" role="alert">Google sign-in did not go through. Please try again.</p>}<a href={googleLoginUrl()} className="button google-button"><span className="google-g">G</span> Continue with Google <ArrowRight size={17} /></a><p className="privacy-note"><ShieldCheck size={15} /> A secure sign-in, just for you. We never share your details.</p><Link to="/products" className="login-shop-link">Rather keep browsing? <span>Explore the collection</span></Link></div></div></div>;
}
