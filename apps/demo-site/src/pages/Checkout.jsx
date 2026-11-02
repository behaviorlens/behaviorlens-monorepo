import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../cart';
import { formatPrice } from '../catalog';

const FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'address', label: 'Street address', autoComplete: 'street-address' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'cardNumber', label: 'Card number (test only)', autoComplete: 'off', inputMode: 'numeric' }
];

const validate = values => {
  const errors = {};
  FIELDS.forEach(field => {
    if (!values[field.name]?.trim()) {
      errors[field.name] = `${field.label.replace(' (test only)', '')} is required.`;
    }
  });
  if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    errors.email = 'Enter an email like name@example.com.';
  }
  if (values.cardNumber && values.cardNumber.replace(/\s/g, '').length !== 16) {
    errors.cardNumber = 'Card number must be 16 digits.';
  }
  return errors;
};

let orderCounter = 1000;

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const submit = event => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      orderCounter += 1;
      clear();
      navigate(`/order/${orderCounter}`);
    }
  };

  return (
    <>
      <h1>Checkout</h1>
      <p>Order total: <strong data-testid="checkout-total">{formatPrice(total)}</strong></p>
      <form className="checkout-form" onSubmit={submit} noValidate data-testid="checkout-form">
        {FIELDS.map(field => (
          <label key={field.name} className="field">
            <span>{field.label}</span>
            <input
              name={field.name}
              type={field.type || 'text'}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              value={values[field.name] || ''}
              aria-invalid={Boolean(errors[field.name])}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))}
              data-testid={`checkout-${field.name}`}
            />
            {errors[field.name] && (
              <span className="field-error" id={`${field.name}-error`} data-testid={`error-${field.name}`}>
                {errors[field.name]}
              </span>
            )}
          </label>
        ))}
        <button type="submit" className="button" data-testid="place-order">Place order</button>
      </form>
    </>
  );
};

export default Checkout;
