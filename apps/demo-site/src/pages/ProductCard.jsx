import { Link } from 'react-router-dom';
import { formatPrice } from '../catalog';

const ProductCard = ({ product }) => (
  <li className="product-card">
    <Link to={`/products/${product.id}`} data-testid={`product-link-${product.id}`}>
      <span className="product-swatch" style={{ background: product.color }} aria-hidden="true" />
      <span className="product-name">{product.name}</span>
      <span className="product-price">{formatPrice(product.price)}</span>
    </Link>
  </li>
);

export default ProductCard;
