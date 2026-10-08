import { ArrowDownRight, ArrowRight, Leaf, PackageCheck, Recycle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/ProductGrid';
import { EmptyState, ErrorState, Loading } from '../components/Status';
import { useProducts } from '../hooks/useShopQueries';

const promises = [
  { icon: Leaf, title: 'Natural by nature', text: 'Honest materials, chosen with the earth in mind.' },
  { icon: PackageCheck, title: 'Made to be kept', text: 'Thoughtful pieces that earn their place at home.' },
  { icon: Recycle, title: 'Less, but better', text: 'Small-batch objects with a lighter footprint.' },
];

export function HomePage() {
  const { data, isPending, isError, refetch } = useProducts({ sort: 'newest' });
  return <>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">A little more considered</p><h1>Make room<br />for <em>meaning.</em></h1><p className="hero-description">Objects for everyday rituals, gathered from makers who believe the things we live with should feel as good as they look.</p><Link className="button button-dark" to="/products">Explore the collection <ArrowRight size={17} /></Link><div className="hero-note"><span className="hero-note-line" /> Thoughtfully sourced, always</div></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=90" alt="Sunlit, thoughtfully styled living space with natural textures" /><div className="image-caption"><span>At home with the everyday</span><span>01 / 03</span></div></div><a className="scroll-cue" href="#collection" aria-label="Scroll to new arrivals"><ArrowDownRight size={17} /></a></section>
    <section className="intro-strip"><p>Objects with a point of view.<br /><span>Made with time, kept for longer.</span></p><span className="intro-stamp">C&L<br />EST. 2024</span></section>
    <section className="section collection-section" id="collection"><div className="section-heading"><div><p className="eyebrow">Find your everyday</p><h2>A few good things</h2></div><Link className="text-link" to="/products">Shop everything <ArrowRight size={16} /></Link></div>{isPending ? <Loading /> : isError ? <ErrorState onRetry={() => void refetch()} /> : data?.items.length ? <ProductGrid products={data.items.slice(0, 4)} /> : <EmptyState title="A little quiet on the shelves" message="Check back soon for new arrivals." />}</section>
    <section className="story-section" id="our-story"><div className="story-image"><img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=85" alt="Handmade objects and organic materials in a quiet home" loading="lazy" /></div><div className="story-copy"><p className="eyebrow">The Cedar & Loom way</p><h2>Good things<br />take <em>their time.</em></h2><p>We believe a home is made in the little moments. A cup held in both hands. Linen that softens with every wash. Pieces that tell the story of the hands that made them.</p><p>So we look for honest materials, independent makers, and the kind of beauty that doesn't need to shout.</p><Link to="/products" className="text-link">Get to know our collection <ArrowRight size={16} /></Link></div></section>
    <section className="promise-section">{promises.map(({ icon: Icon, title, text }, index) => <article className="promise-card" key={title}><span className="promise-index">0{index + 1}</span><Icon size={22} strokeWidth={1.4} /><h3>{title}</h3><p>{text}</p></article>)}</section>
    <section className="closing-cta"><p className="eyebrow">For the life you live</p><h2>Keep good<br /><em>company.</em></h2><Link to="/products" className="button button-light">Find your something <ArrowRight size={17} /></Link></section>
  </>;
}
