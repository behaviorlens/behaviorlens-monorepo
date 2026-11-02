// Describes the element a visitor interacted with in a form that survives
// page reloads: test id, ARIA role, accessible name, and a selector that
// Playwright can use later (feature 02 turns sessions into tests).
// Values typed into fields are never read.

const INTERACTIVE = 'a,button,input,select,textarea,label,summary,option,[role],[data-testid],[onclick],[tabindex]';
const MAX_NAME = 80;

const INPUT_ROLES = {
  button: 'button',
  submit: 'button',
  reset: 'button',
  image: 'button',
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'slider',
  search: 'searchbox',
  number: 'spinbutton'
};

// CSS.escape where available; a conservative fallback elsewhere.
const cssEscape = value => (globalThis.CSS?.escape
  ? globalThis.CSS.escape(value)
  : String(value).replace(/[^a-zA-Z0-9_-]/g, character => `\\${character}`));

const clean = text => String(text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);

export const roleOf = element => {
  const explicit = element.getAttribute('role');
  if (explicit) {
    return explicit.split(/\s+/)[0];
  }
  const tag = element.tagName;
  if (tag === 'A') return element.hasAttribute('href') ? 'link' : null;
  if (tag === 'BUTTON' || tag === 'SUMMARY') return 'button';
  if (tag === 'SELECT') return 'combobox';
  if (tag === 'TEXTAREA') return 'textbox';
  if (tag === 'OPTION') return 'option';
  if (tag === 'IMG') return 'img';
  if (/^H[1-6]$/.test(tag)) return 'heading';
  if (tag === 'INPUT') {
    const type = (element.getAttribute('type') || 'text').toLowerCase();
    return INPUT_ROLES[type] || 'textbox';
  }
  return null;
};

const labelText = element => {
  const { id } = element;
  if (id) {
    const label = element.ownerDocument.querySelector(`label[for="${cssEscape(id)}"]`);
    if (label) return label.textContent;
  }
  const wrapping = element.closest('label');
  if (wrapping) {
    // The label's own text, without the text of the field inside it.
    return Array.from(wrapping.childNodes)
      .filter(node => node.nodeType === 3 || (node.nodeType === 1 && !node.matches('input,select,textarea')))
      .map(node => node.textContent)
      .join(' ');
  }
  return '';
};

export const accessibleName = element => {
  const aria = element.getAttribute('aria-label');
  if (aria) return clean(aria);
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy.split(/\s+/)
      .map(id => element.ownerDocument.getElementById(id)?.textContent || '')
      .join(' ');
    if (clean(text)) return clean(text);
  }
  const tag = element.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    const type = (element.getAttribute('type') || '').toLowerCase();
    // Button-like inputs show their value as their label; that is not user data.
    if (['button', 'submit', 'reset'].includes(type)) return clean(element.getAttribute('value'));
    return clean(labelText(element) || element.getAttribute('placeholder') || element.getAttribute('title'));
  }
  if (tag === 'IMG') return clean(element.getAttribute('alt'));
  return clean(element.textContent || element.getAttribute('title'));
};

const quote = value => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const cssPath = element => {
  const parts = [];
  let node = element;
  while (node && node.nodeType === 1 && parts.length < 4 && node.tagName !== 'BODY' && node.tagName !== 'HTML') {
    const tag = node.tagName.toLowerCase();
    const parent = node.parentElement;
    const siblings = parent ? Array.from(parent.children).filter(child => child.tagName === node.tagName) : [];
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(node) + 1})` : tag);
    node = parent;
  }
  return parts.join(' > ');
};

// Auto-generated ids (React useId, numeric suffixes) change between loads.
const stableId = id => id && !/^:r|^\d|[:]|\d{4,}/.test(id);

export const targetOf = element => {
  if (!element || element.nodeType !== 1) return null;
  return element.closest(INTERACTIVE) || element;
};

export const describeElement = element => {
  const target = targetOf(element);
  if (!target) return null;
  const testIdElement = target.closest('[data-testid]');
  const testId = testIdElement ? testIdElement.getAttribute('data-testid') : null;
  const role = roleOf(target);
  const name = accessibleName(target);
  let selector;
  if (testId) {
    selector = `[data-testid=${quote(testId)}]`;
  } else if (role && name) {
    selector = `role=${role}[name=${quote(name)}]`;
  } else if (stableId(target.id)) {
    selector = `#${cssEscape(target.id)}`;
  } else {
    selector = cssPath(target);
  }
  return {
    tag: target.tagName.toLowerCase(),
    testId,
    role,
    name: name || null,
    selector
  };
};
