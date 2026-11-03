import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { formatPrice } from '../catalog';
import { hasDefect } from '../defects';

const Cart = () => {
  const navigate = useNavigate();
  const { items, setQuantity, total } = useCart();
  const hiddenCheckout = hasDefect('hidden-checkout');

  if (items.length === 0) {
    return (
      <>
        <h1>Your cart</h1>
        <p className="empty" data-testid="cart-empty">
          Your cart is empty. <Link to="/products" data-testid="cart-browse">Browse products</Link>
        </p>
      </>
    );
  }

  const checkoutButton = (
    <button
      type="button"
      className={hiddenCheckout ? 'checkout-hidden' : 'button'}
      data-testid="checkout-button"
      onClick={() => navigate('/checkout')}
    >
      {hiddenCheckout ? 'continue' : 'Go to checkout'}
    </button>
  );

  return (
    <>
      <h1>Your cart</h1>
      <table className="cart-table" data-testid="cart-items">
        <thead>
          <tr><th>Product</th><th>Quantity</th><th>Price</th></tr>
        </thead>
        <tbody>
          {items.map(({ product, quantity }) => (
            <tr key={product.id} data-testid={`cart-line-${product.id}`}>
              <td>{product.name}</td>
              <td>
                <button
                  type="button"
                  aria-label={`Remove one ${product.name}`}
                  data-testid={`decrease-${product.id}`}
                  onClick={() => setQuantity(product.id, quantity - 1)}
                >
                  −
                </button>
                <span className="quantity" data-testid={`quantity-${product.id}`}>{quantity}</span>
                <button
                  type="button"
                  aria-label={`Add one ${product.name}`}
                  data-testid={`increase-${product.id}`}
                  onClick={() => setQuantity(product.id, quantity + 1)}
                >
                  +
                </button>
              </td>
              <td>{formatPrice(quantity * product.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cart-total">
        Total: <strong data-testid="cart-total">{formatPrice(total)}</strong>
      </p>
      {!hiddenCheckout && checkoutButton}
      {hiddenCheckout && (
        <>
          <p className="cart-note">
            Orders ship within three working days. Delivery is free on orders over $50. You can
            return any unused item within 30 days for a full refund. Gift wrapping is available at
            checkout. Prices include tax. Questions about an order can be sent to our support team,
            who answer within one working day.
          </p>
          {checkoutButton}
        </>
      )}
    </>
  );
};

export default Cart;
