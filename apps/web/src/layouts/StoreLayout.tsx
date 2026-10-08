import { ArrowUpRight, Menu, ShoppingBag, X } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../stores/CartStore';
import { STORE_NAME } from '@shop/shared';

export function StoreLayout() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <div className="site-shell">
    <div className="announcement">Objects for a slower, more thoughtful home <span>·</span> Complimentary delivery, always</div>
    <header className="site-header"><Link to="/" className="brand" onClick={closeMenu}><span className="brand-mark">c.</span><span>{STORE_NAME}<small>THOUGHTFUL LIVING</small></span></Link>
      <button className="mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation"><NavLink to="/products" onClick={closeMenu}>Shop all</NavLink><a href="/#our-story" onClick={closeMenu}>Our story</a><NavLink to="/orders" onClick={closeMenu}>My orders</NavLink></nav>
      <div className="header-actions"><Link className="account-link" to="/account">Account <ArrowUpRight size={15} /></Link><Link className="bag-link" to="/cart" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={20} /><span>Bag</span><b>{count}</b></Link></div>
    </header>
    <main><Outlet /></main>
    <footer className="site-footer"><div className="footer-top"><div><Link to="/" className="brand footer-brand"><span className="brand-mark">c.</span><span>{STORE_NAME}<small>THOUGHTFUL LIVING</small></span></Link><p>Made to be lived with. Chosen with care.</p></div><div className="footer-links"><Link to="/products">Shop the collection</Link><Link to="/account">Your account</Link><Link to="/orders">Order support</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {STORE_NAME}. Made for everyday living.</span><span>Thoughtfully sourced · Lovingly made</span></div></footer>
  </div>;
}
