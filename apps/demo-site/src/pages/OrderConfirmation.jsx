import { Link, useParams } from 'react-router-dom';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  return (
    <section className="confirmation" data-testid="order-confirmation">
      <h1>Thank you for your order</h1>
      <p>
        Your order number is <strong data-testid="order-number">{orderId}</strong>. This is a demo
        shop, so nothing will be charged or shipped.
      </p>
      <Link to="/" className="button" data-testid="back-home">Back to the shop</Link>
    </section>
  );
};

export default OrderConfirmation;
