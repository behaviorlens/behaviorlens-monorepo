import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, PRODUCTS } from '../catalog';
import { hasDefect } from '../defects';
import ProductCard from './ProductCard';

const matchesQuery = (product, query) => {
  if (!query) {
    return true;
  }
  const haystack = `${product.name} ${product.description}`;
  // Defect "silent-search": exact-case matching only.
  return hasDefect('silent-search')
    ? haystack.includes(query)
    : haystack.toLowerCase().includes(query.toLowerCase());
};

const Catalog = () => {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const categoryId = params.get('category') || '';
  const category = CATEGORIES.find(item => item.id === categoryId);
  const results = PRODUCTS.filter(product => (!category || product.category === category.id)
    && matchesQuery(product, query));

  let heading = category ? category.name : 'All products';
  if (query) {
    heading = `Results for "${query}"`;
  }

  return (
    <>
      <h1 data-testid="catalog-heading">{heading}</h1>
      {results.length > 0 && (
        <ul className="product-grid" data-testid="product-results">
          {results.map(product => <ProductCard key={product.id} product={product} />)}
        </ul>
      )}
      {results.length === 0 && !hasDefect('silent-search') && (
        <p className="empty" data-testid="no-results">
          No products match your search. Try a shorter word or browse a category.
        </p>
      )}
    </>
  );
};

export default Catalog;
