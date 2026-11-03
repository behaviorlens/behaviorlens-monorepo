import {
  createContext, useContext, useEffect, useMemo, useState
} from 'react';
import { getProduct } from './catalog';

const CartContext = createContext(null);
const STORAGE_KEY = 'demo-site:cart';

const load = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [lines, setLines] = useState(load);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch (error) {
      // Cart then lives only in memory.
    }
  }, [lines]);

  const value = useMemo(() => {
    const items = lines
      .map(line => ({ ...line, product: getProduct(line.productId) }))
      .filter(line => line.product);
    return {
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      total: items.reduce((sum, line) => sum + line.quantity * line.product.price, 0),
      add: productId => setLines(current => {
        const existing = current.find(line => line.productId === productId);
        if (existing) {
          return current.map(line => (line.productId === productId
            ? { ...line, quantity: line.quantity + 1 }
            : line));
        }
        return [...current, { productId, quantity: 1 }];
      }),
      setQuantity: (productId, quantity) => setLines(current => (quantity <= 0
        ? current.filter(line => line.productId !== productId)
        : current.map(line => (line.productId === productId ? { ...line, quantity } : line)))),
      clear: () => setLines([])
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
