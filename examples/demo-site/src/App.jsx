import { useState } from 'react';
import {
  Link, NavLink, Route, Routes, useNavigate
} from 'react-router-dom';
import { useCart } from './CartContext';
import { CATEGORIES } from './catalog';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';

const SearchForm = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  return (
    <form
      className="search"
      role="search"
      onSubmit={event => {
        event.preventDefault();
        navigate(`/products?q=${encodeURIComponent(query.trim())}`);
      }}
    >
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products"
        value={query}
        onChange={event => setQuery(event.target.value)}
        data-testid="search-input"
      />
      <button type="submit" data-testid="search-submit">Search</button>
    </form>
  );
};

const App = () => {
  const { count } = useCart();
  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo" data-testid="nav-home">Harbor &amp; Pine</Link>
        <nav aria-label="Categories">
          <NavLink to="/products" end data-testid="nav-all">All</NavLink>
          {CATEGORIES.map(category => (
            <NavLink
              key={category.id}
              to={`/products?category=${category.id}`}
              data-testid={`nav-category-${category.id}`}
            >
              {category.name}
            </NavLink>
          ))}
        </nav>
        <SearchForm />
        <Link to="/cart" className="cart-link" data-testid="nav-cart">
          Cart
          <span className="cart-count" data-testid="cart-count">{count}</span>
        </Link>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Catalog />} />
          <Route path="/products/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:orderId" element={<OrderConfirmation />} />
          <Route path="*" element={<p data-testid="not-found">Page not found.</p>} />
        </Routes>
      </main>
      <footer className="site-footer">Harbor &amp; Pine is a demo shop for BehaviorLens. Nothing here is for sale.</footer>
    </>
  );
};

export default App;
