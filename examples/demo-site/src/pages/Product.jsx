import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../CartContext';
import { formatPrice, getProduct } from '../catalog';

const Product = () => {
  const { id } = useParams();
  const product = getProduct(id);
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (!product) {
    return <p data-testid="not-found">This product does not exist.</p>;
  }

  return (
    <article className="product-detail">
      <span className="product-swatch large" style={{ background: product.color }} aria-hidden="true" />
      <div>
        <h1 data-testid="product-name">{product.name}</h1>
        <p className="product-price" data-testid="product-price">{formatPrice(product.price)}</p>
        <p>{product.description}</p>
        <button
          type="button"
          className="button"
          data-testid="add-to-cart"
          onClick={() => {
            add(product.id);
            setAdded(true);
          }}
        >
          Add to cart
        </button>
        {added && (
          <p className="notice" role="status" data-testid="added-notice">
            Added to your cart. <Link to="/cart" data-testid="go-to-cart">View cart</Link>
          </p>
        )}
      </div>
    </article>
  );
};

export default Product;
