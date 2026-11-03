// Fixed catalog: the same products, prices and order on every run, so tests
// and experiments replay against an identical site.
export const CATEGORIES = [
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'outdoor', name: 'Outdoor' },
  { id: 'desk', name: 'Desk' }
];

export const PRODUCTS = [
  { id: 'p1', name: 'Enamel Mug', category: 'kitchen', price: 14, color: '#d9644a', description: 'A sturdy 350 ml mug with a speckled enamel finish.' },
  { id: 'p2', name: 'Pour-Over Kettle', category: 'kitchen', price: 48, color: '#3d5a80', description: 'Gooseneck kettle for a slow, even pour. 1 litre.' },
  { id: 'p3', name: 'Oak Cutting Board', category: 'kitchen', price: 36, color: '#a47148', description: 'End-grain oak board, oiled and ready to use.' },
  { id: 'p4', name: 'Linen Tea Towels', category: 'kitchen', price: 18, color: '#9aa88f', description: 'Set of two stonewashed linen towels.' },
  { id: 'p5', name: 'Camp Lantern', category: 'outdoor', price: 29, color: '#e0a526', description: 'Rechargeable lantern with three brightness levels.' },
  { id: 'p6', name: 'Wool Blanket', category: 'outdoor', price: 64, color: '#7b4b5c', description: 'Heavy wool blanket for cold evenings outside.' },
  { id: 'p7', name: 'Trail Bottle', category: 'outdoor', price: 22, color: '#2a9d8f', description: 'Insulated 750 ml bottle that keeps drinks cold for 24 hours.' },
  { id: 'p8', name: 'Folding Stool', category: 'outdoor', price: 31, color: '#5c6b73', description: 'Lightweight stool that folds flat for travel.' },
  { id: 'p9', name: 'Desk Lamp', category: 'desk', price: 55, color: '#264653', description: 'Adjustable LED lamp with warm and cool light.' },
  { id: 'p10', name: 'Notebook Set', category: 'desk', price: 16, color: '#e76f51', description: 'Three dot-grid notebooks, A5, 96 pages each.' },
  { id: 'p11', name: 'Cable Tray', category: 'desk', price: 24, color: '#6d597a', description: 'Under-desk tray that keeps cables out of sight.' },
  { id: 'p12', name: 'Felt Desk Mat', category: 'desk', price: 27, color: '#8d99ae', description: 'Wool felt mat, 80 × 30 cm.' }
];

export const getProduct = id => PRODUCTS.find(product => product.id === id) || null;

export const formatPrice = value => `$${value.toFixed(2)}`;
