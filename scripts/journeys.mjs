// Scripted visits to the demo shop, shared by the seed script and the
// end-to-end tests. Each journey names a fictional visitor, a start path
// (optionally with a planted ?defect=), a referrer, and the steps to run.
// The mouse moves in steps before every click, so replays show a cursor path.

// Fictional visitors; journeys refer to them by index.
export const VISITORS = [
  'Avery Park', 'Jordan Lee', 'Sam Rivera', 'Taylor Kim', 'Morgan Diaz', 'Riley Chen'
];

export const pause = ms => new Promise(resolve => { setTimeout(resolve, ms); });

// Moves the mouse in steps before clicking, so the replay shows a cursor path.
export const click = async (page, selector, { times = 1 } = {}) => {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) {
    throw new Error(`Not visible: ${selector}`);
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 15 });
  await pause(250);
  for (let index = 0; index < times; index += 1) {
    await page.mouse.click(x, y);
    await pause(times > 1 ? 120 : 400);
  }
};

export const byTestId = id => `[data-testid="${id}"]`;
export const type = async (page, testId, text) => {
  await click(page, byTestId(testId));
  await page.keyboard.type(text, { delay: 60 });
  await pause(300);
};
const scroll = async (page, deltaY) => {
  await page.mouse.wheel(0, deltaY);
  await pause(600);
};

export const fillCheckout = async (page, overrides = {}) => {
  const values = {
    fullName: 'Avery Park',
    email: 'avery.park@example.com',
    address: '12 Example Street',
    city: 'Ankara',
    cardNumber: '4242 4242 4242 4242',
    ...overrides
  };
  for (const [field, value] of Object.entries(values)) {
    if (value) {
      await type(page, `checkout-${field}`, value);
    }
  }
};

const addProduct = async (page, productId) => {
  await click(page, byTestId(`product-link-${productId}`));
  await pause(900);
  await click(page, byTestId('add-to-cart'));
  await pause(700);
};

export const JOURNEYS = [
  {
    user: 0, path: '/', referrer: 'https://www.google.com/',
    run: async page => {
      await scroll(page, 300);
      await addProduct(page, 'p2');
      await click(page, byTestId('go-to-cart'));
      await click(page, byTestId('checkout-button'));
      await fillCheckout(page);
      await click(page, byTestId('place-order'));
      await pause(1500);
    }
  },
  {
    user: 1, path: '/', referrer: '',
    run: async page => {
      await type(page, 'search-input', 'lamp');
      await click(page, byTestId('search-submit'));
      await pause(800);
      await addProduct(page, 'p9');
      await click(page, byTestId('nav-cart'));
      await click(page, byTestId('checkout-button'));
      await fillCheckout(page, { fullName: 'Jordan Lee', email: 'jordan.lee@example.com', city: 'Berlin' });
      await click(page, byTestId('place-order'));
      await pause(1500);
    }
  },
  {
    user: 2, path: '/', referrer: 'https://news.example.com/gift-guide',
    run: async page => {
      await click(page, byTestId('nav-category-outdoor'));
      await pause(800);
      await addProduct(page, 'p6');
      await click(page, byTestId('go-to-cart'));
      await click(page, byTestId('increase-p6'));
      await click(page, byTestId('checkout-button'));
      await fillCheckout(page, { fullName: 'Sam Rivera', email: 'sam.rivera@example.org', city: 'Denver' });
      await click(page, byTestId('place-order'));
      await pause(1500);
    }
  },
  {
    // Validation errors, then a corrected submission.
    user: 3, path: '/products', referrer: '',
    run: async page => {
      await addProduct(page, 'p10');
      await click(page, byTestId('go-to-cart'));
      await click(page, byTestId('checkout-button'));
      await fillCheckout(page, { fullName: 'Taylor Kim', email: 'taylor.kim', cardNumber: '4242' });
      await click(page, byTestId('place-order'));
      await pause(1500);
      await page.locator(byTestId('checkout-email')).fill('');
      await type(page, 'checkout-email', 'taylor.kim@example.net');
      await page.locator(byTestId('checkout-cardNumber')).fill('');
      await type(page, 'checkout-cardNumber', '4242 4242 4242 4242');
      await click(page, byTestId('place-order'));
      await pause(1500);
    }
  },
  {
    // Defect silent-search: a lowercase query shows an empty page, the visitor retries.
    user: 4, path: '/?defect=silent-search', referrer: 'https://www.google.com/',
    run: async page => {
      await type(page, 'search-input', 'kettle');
      await click(page, byTestId('search-submit'));
      await pause(2500);
      await scroll(page, 200);
      await pause(1500);
      await page.locator(byTestId('search-input')).fill('');
      await type(page, 'search-input', 'Kettle');
      await click(page, byTestId('search-submit'));
      await pause(900);
      await addProduct(page, 'p2');
      await click(page, byTestId('go-to-cart'));
      await click(page, byTestId('checkout-button'));
      await fillCheckout(page, { fullName: 'Morgan Diaz', email: 'morgan.diaz@example.com', city: 'Madrid' });
      await click(page, byTestId('place-order'));
      await pause(1500);
    }
  },
  {
    // Defect hidden-checkout: the visitor hunts for the button, rage-clicks the total, then finds it.
    user: 5, path: '/?defect=hidden-checkout', referrer: '',
    run: async page => {
      await addProduct(page, 'p1');
      await click(page, byTestId('go-to-cart'));
      await pause(1500);
      await click(page, byTestId('cart-total'), { times: 4 });
      await pause(2000);
      await scroll(page, 300);
      await pause(3000);
      await scroll(page, 400);
      await click(page, byTestId('checkout-button'));
      await fillCheckout(page, { fullName: 'Riley Chen', email: 'riley.chen@example.org', city: 'Toronto' });
      await click(page, byTestId('place-order'));
      await pause(1500);
    }
  },
  {
    // Defect hidden-checkout: the visitor gives up.
    user: 0, path: '/?defect=hidden-checkout', referrer: '',
    run: async page => {
      await click(page, byTestId('nav-category-desk'));
      await addProduct(page, 'p12');
      await click(page, byTestId('go-to-cart'));
      await pause(2000);
      await click(page, byTestId('cart-total'), { times: 3 });
      await pause(4000);
      await click(page, byTestId('nav-home'));
      await pause(2000);
    }
  },
  {
    // Bounce: one product view, then leaves.
    user: 1, path: '/', referrer: 'https://social.example.com/',
    run: async page => {
      await scroll(page, 250);
      await click(page, byTestId('product-link-p9'));
      await pause(3000);
    }
  },
  {
    // Clicks the non-interactive product image several times before adding to cart.
    user: 2, path: '/products?category=kitchen', referrer: '',
    run: async page => {
      await click(page, byTestId('product-link-p3'));
      await pause(800);
      await click(page, '.product-swatch.large', { times: 5 });
      await pause(1200);
      await click(page, byTestId('add-to-cart'));
      await click(page, byTestId('go-to-cart'));
      await pause(1500);
    }
  },
  {
    // No results (message shown), then category browsing.
    user: 3, path: '/', referrer: 'https://www.google.com/',
    run: async page => {
      await type(page, 'search-input', 'umbrella');
      await click(page, byTestId('search-submit'));
      await pause(2000);
      await click(page, byTestId('nav-category-outdoor'));
      await addProduct(page, 'p7');
      await click(page, byTestId('go-to-cart'));
      await pause(1200);
    }
  },
  {
    // Cart editing: two products, one removed, then checkout.
    user: 4, path: '/products', referrer: '',
    run: async page => {
      await addProduct(page, 'p4');
      await click(page, byTestId('nav-all'));
      await addProduct(page, 'p11');
      await click(page, byTestId('go-to-cart'));
      await click(page, byTestId('decrease-p4'));
      await pause(800);
      await click(page, byTestId('checkout-button'));
      await fillCheckout(page, { fullName: 'Morgan Diaz', email: 'morgan.diaz@example.com', city: 'Madrid' });
      await click(page, byTestId('place-order'));
      await pause(1500);
    }
  },
  {
    // Browses three categories without buying.
    user: 5, path: '/', referrer: '',
    run: async page => {
      await click(page, byTestId('nav-category-kitchen'));
      await pause(1500);
      await click(page, byTestId('nav-category-desk'));
      await pause(1500);
      await scroll(page, 300);
      await click(page, byTestId('product-link-p11'));
      await pause(2500);
    }
  }
];
