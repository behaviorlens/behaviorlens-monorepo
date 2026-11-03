import { Link } from 'react-router-dom';
import { PRODUCTS } from '../catalog';
import ProductCard from './ProductCard';

const FEATURED = ['p2', 'p6', 'p9', 'p1'];

const Home = () => (
  <>
    <section className="hero">
      <h1>Simple things, made well.</h1>
      <p>Kitchen, outdoor and desk goods that last.</p>
      <Link to="/products" className="button" data-testid="hero-shop-all">Shop all products</Link>
    </section>
    <h2>Featured</h2>
    <ul className="product-grid" data-testid="featured-products">
      {FEATURED.map(id => PRODUCTS.find(product => product.id === id)).map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  </>
);

export default Home;
