import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <div className="not-found"><span className="not-found-number">404</span><p className="eyebrow">A little off the path</p><h1>Nothing here,<br /><em>just yet.</em></h1><p>That page may have moved on to a new home.</p><div><Link to="/" className="button button-dark"><ArrowLeft size={16} /> Back home</Link><Link to="/products" className="text-link">Browse the collection <ArrowRight size={16} /></Link></div></div>;
}
