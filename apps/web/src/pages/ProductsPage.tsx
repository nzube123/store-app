import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { ProductQuery } from '@shop/shared';
import { ProductGrid } from '../components/ProductGrid';
import { EmptyState, ErrorState, Loading } from '../components/Status';
import { useCategories, useProducts } from '../hooks/useShopQueries';

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<ProductQuery['sort']>('featured');
  const products = useProducts({ search, category, sort });
  const categories = useCategories();
  return <div className="page-container catalog-page"><div className="page-intro"><p className="eyebrow">The collection</p><h1>Useful things.<br /><em>Beautifully considered.</em></h1><p>Everyday objects from independent makers, chosen to be used, loved, and kept.</p></div>
    <div className="catalog-tools"><div className="search-field"><Search size={18} /><label className="sr-only" htmlFor="product-search">Search the collection</label><input id="product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" /></div><label className="select-field"><SlidersHorizontal size={16} /><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">All categories</option>{categories.data?.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="select-field sort-field"><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value as ProductQuery['sort'])}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
    {products.isPending ? <Loading /> : products.isError ? <ErrorState onRetry={() => void products.refetch()} /> : products.data?.items.length ? <><p className="results-count">{products.data.pagination.total} pieces in this collection</p><ProductGrid products={products.data.items} /></> : <EmptyState title="Nothing on this shelf" message="Try another search or category to find what you're looking for." />}
  </div>;
}
