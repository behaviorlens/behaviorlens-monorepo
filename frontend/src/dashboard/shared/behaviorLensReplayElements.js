import { readAttribute, readNodeText } from './behaviorLensElementLabels';
import {
  containsSensitiveSemanticString,
  sanitizeSemanticString
} from './behaviorLensSemanticSafety';

const RRWEB_DOCUMENT_NODE = 0;
const RRWEB_ELEMENT_NODE = 2;
const RRWEB_FULL_SNAPSHOT = 2;
const RRWEB_INCREMENTAL = 3;
const MUTATION_SOURCE = 0;

const INTERACTIVE_ROLES = new Set([
  'button', 'checkbox', 'combobox', 'gridcell', 'link', 'listbox', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'searchbox', 'slider',
  'spinbutton', 'switch', 'tab', 'textbox', 'treeitem'
]);
const STABLE_DATA_ATTRIBUTES = [
  'data-label', 'data-testid', 'data-test', 'data-qa', 'data-cy', 'question-label'
];
const TEXT_LIKE_INPUT_TYPES = new Set([
  '', 'email', 'number', 'password', 'search', 'tel', 'text', 'url'
]);
const SAFE_EXPLICIT_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
  'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
  'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
  'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
  'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
  'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
  'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
  'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab',
  'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip',
  'tree', 'treegrid', 'treeitem'
]);
const SAFE_NATIVE_TAGS = new Set([
  'a', 'article', 'aside', 'button', 'div', 'footer', 'form', 'header', 'img', 'input',
  'label', 'li', 'main', 'nav', 'option', 'section', 'select', 'span', 'table', 'td',
  'textarea', 'th', 'tr', 'ul'
]);
const STRUCTURAL_TEXT_TAGS = new Set([
  'caption', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'legend', 'summary'
]);
const STRUCTURAL_TEXT_ROLES = new Set([
  'columnheader', 'heading', 'menuitem', 'option', 'rowheader', 'tab', 'treeitem'
]);
const STRUCTURAL_TEXT_HINT = /(?:^|[\s_-])(?:breadcrumb|caption|header|heading|helper|label|menu|tab|title)(?:$|[\s_-])/iu;
const PRIVACY_REJECTED_NAME = Symbol('privacy-rejected-name');

const emptyElementName = () => ({ name: null, nameSource: 'none', textDerived: false });

export const unresolvedReplayElement = () => ({
  ...emptyElementName(),
  role: 'unknown',
  nodeResolved: false,
  interactiveTargetResolved: false,
  climbed: false
});

const semanticNameCandidate = (value, maxLength = 80) => {
  if (containsSensitiveSemanticString(value)) return PRIVACY_REJECTED_NAME;
  return sanitizeSemanticString(value, maxLength);
};

const cloneAttributes = attributes => {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return {};
  }
  return { ...attributes };
};

const cloneNode = node => ({
  ...node,
  attributes: cloneAttributes(node?.attributes),
  childNodes: []
});

const getNodeRootId = node => (
  Number.isFinite(node?.rootId)
    ? node.rootId
    : (node?.type === RRWEB_DOCUMENT_NODE && Number.isFinite(node.id) ? node.id : null)
);

const sameReplayRoot = (child, parent) => {
  const childRoot = getNodeRootId(child);
  const parentRoot = getNodeRootId(parent);
  return childRoot === null || parentRoot === null || childRoot === parentRoot;
};

const isInteractiveNode = node => {
  if (node?.type !== RRWEB_ELEMENT_NODE) {
    return false;
  }
  const tag = String(node.tagName || '').toLowerCase();
  const role = readAttribute(node, 'role')?.toLowerCase();
  if (role && INTERACTIVE_ROLES.has(role)) {
    return true;
  }
  if (['button', 'input', 'select', 'textarea'].includes(tag)) {
    return true;
  }
  if (tag === 'a' && readAttribute(node, 'href')) {
    return true;
  }
  if (readAttribute(node, 'contenteditable')?.toLowerCase() === 'true') {
    return true;
  }
  const tabIndexAttribute = readAttribute(node, 'tabindex');
  const tabIndex = tabIndexAttribute === null ? Number.NaN : Number(tabIndexAttribute);
  return Number.isFinite(tabIndex) && tabIndex >= 0;
};

export const getReplayElementRole = node => {
  const explicit = sanitizeSemanticString(readAttribute(node, 'role'), 32)?.toLowerCase();
  if (explicit && SAFE_EXPLICIT_ROLES.has(explicit)) {
    return explicit;
  }
  const tag = String(node?.tagName || '').toLowerCase();
  if (tag === 'a' && readAttribute(node, 'href')) return 'link';
  if (tag === 'button') return 'button';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'select') return 'combobox';
  if (tag === 'input') {
    const type = (readAttribute(node, 'type') || '').toLowerCase();
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (TEXT_LIKE_INPUT_TYPES.has(type)) return 'textbox';
  }
  if (readAttribute(node, 'contenteditable')?.toLowerCase() === 'true') return 'textbox';
  return SAFE_NATIVE_TAGS.has(tag) ? tag : 'unknown';
};

const findNodeByDomId = (state, domId, rootId) => {
  return Array.from(state.nodes.values()).find(node => (
    getNodeRootId(node) === rootId && readAttribute(node, 'id') === domId
  )) || null;
};

const labelText = (state, node, allowMutatedText = false) => {
  if (!node) return null;
  const visited = new Set();
  let mutationUpdated = false;
  const project = current => {
    if (!current || visited.has(current.id)) return null;
    visited.add(current.id);
    if (state.mutatedTextNodes.has(current.id)) mutationUpdated = true;
    const projected = { ...current };
    let projectedChildren;
    Object.defineProperty(projected, 'childNodes', {
      enumerable: true,
      get: () => {
        if (!projectedChildren) {
          projectedChildren = (Array.isArray(current.childNodes) ? current.childNodes : [])
            .map(childId => project(state.nodes.get(childId)))
            .filter(Boolean);
        }
        return projectedChildren;
      }
    });
    return projected;
  };
  // Reuse the established reader's 100-character traversal budget and
  // 80-character final cap. The visited set makes malformed cycles safe.
  const value = semanticNameCandidate(readNodeText(project(node)), 80);
  return mutationUpdated && !allowMutatedText ? null : value;
};

const semanticAttribute = (node, name, maxLength = 80) => {
  return semanticNameCandidate(readAttribute(node, name), maxLength);
};

const isStructuralTextNode = node => {
  const tag = String(node?.tagName || '').toLowerCase();
  if (STRUCTURAL_TEXT_TAGS.has(tag)) return true;
  const role = readAttribute(node, 'role')?.toLowerCase();
  if (role && STRUCTURAL_TEXT_ROLES.has(role)) return true;
  return ['class', 'id'].some(attribute => {
    const value = readAttribute(node, attribute);
    return value ? STRUCTURAL_TEXT_HINT.test(value) : false;
  });
};

const findAssociatedLabel = (state, node) => {
  const domId = readAttribute(node, 'id');
  if (domId) {
    const candidate = Array.from(state.nodes.values()).find(current => (
      getNodeRootId(current) === getNodeRootId(node)
      && String(current?.tagName || '').toLowerCase() === 'label'
      && readAttribute(current, 'for') === domId
      && labelText(state, current, true)
    ));
    if (candidate) return labelText(state, candidate, true);
  }
  let current = node;
  while (Number.isFinite(state.parents.get(current.id))) {
    const parent = state.nodes.get(state.parents.get(current.id));
    if (!parent || !sameReplayRoot(current, parent)) break;
    if (String(parent.tagName || '').toLowerCase() === 'label') {
      return labelText(state, parent, true);
    }
    current = parent;
  }
  return null;
};

const getElementName = (state, node) => {
  const direct = semanticAttribute(node, 'aria-label');
  if (direct === PRIVACY_REJECTED_NAME) return emptyElementName();
  if (direct) return { name: direct, nameSource: 'aria-label', textDerived: false };

  const labelledBy = semanticAttribute(node, 'aria-labelledby');
  if (labelledBy === PRIVACY_REJECTED_NAME) return emptyElementName();
  if (labelledBy) {
    const pieces = labelledBy.split(/\s+/u)
      .map(domId => labelText(state, findNodeByDomId(state, domId, getNodeRootId(node)), true))
      .filter(Boolean);
    if (pieces.includes(PRIVACY_REJECTED_NAME)) return emptyElementName();
    const name = semanticNameCandidate(pieces.join(' '));
    if (name === PRIVACY_REJECTED_NAME) return emptyElementName();
    if (name) return { name, nameSource: 'aria-labelledby', textDerived: true };
  }

  for (let index = 0; index < STABLE_DATA_ATTRIBUTES.length; index += 1) {
    const value = semanticAttribute(node, STABLE_DATA_ATTRIBUTES[index]);
    if (value === PRIVACY_REJECTED_NAME) return emptyElementName();
    if (value) return { name: value, nameSource: 'data-attribute', textDerived: false };
  }

  const associatedLabel = findAssociatedLabel(state, node);
  if (associatedLabel === PRIVACY_REJECTED_NAME) return emptyElementName();
  if (associatedLabel) return { name: associatedLabel, nameSource: 'label', textDerived: true };

  const tag = String(node?.tagName || '').toLowerCase();
  if (tag === 'button' || tag === 'a') {
    const text = labelText(state, node, true);
    if (text === PRIVACY_REJECTED_NAME) return emptyElementName();
    if (text) return { name: text, nameSource: 'text', textDerived: true };
  }

  const fallbackAttributes = [['title', 'title'], ['alt', 'alt'], ['placeholder', 'placeholder']];
  for (let index = 0; index < fallbackAttributes.length; index += 1) {
    const [attribute, nameSource] = fallbackAttributes[index];
    const name = semanticAttribute(node, attribute);
    if (name === PRIVACY_REJECTED_NAME) return emptyElementName();
    if (name) return { name, nameSource, textDerived: false };
  }

  const text = isStructuralTextNode(node) ? labelText(state, node) : null;
  if (text === PRIVACY_REJECTED_NAME) return emptyElementName();
  if (text) return { name: text, nameSource: 'text', textDerived: true };
  return emptyElementName();
};

const indexTree = (state, rawNode, parentId = null) => {
  if (!rawNode || typeof rawNode !== 'object' || !Number.isFinite(rawNode.id)) return;
  const node = cloneNode(rawNode);
  state.nodes.set(node.id, node);
  if (Number.isFinite(parentId)) state.parents.set(node.id, parentId);
  (Array.isArray(rawNode.childNodes) ? rawNode.childNodes : []).forEach(child => {
    if (Number.isFinite(child?.id)) node.childNodes.push(child.id);
    indexTree(state, child, node.id);
  });
};

const removeTree = (state, nodeId) => {
  const node = state.nodes.get(nodeId);
  if (!node) return;
  node.childNodes.forEach(childId => removeTree(state, childId));
  state.nodes.delete(nodeId);
  state.parents.delete(nodeId);
  state.mutatedTextNodes.delete(nodeId);
};

export const createReplayElementResolver = () => {
  const state = {
    nodes: new Map(),
    parents: new Map(),
    mutatedTextNodes: new Set()
  };

  const processEvent = event => {
    if (event?.type === RRWEB_FULL_SNAPSHOT) {
      state.nodes.clear();
      state.parents.clear();
      state.mutatedTextNodes.clear();
      indexTree(state, event.data?.node);
      return;
    }
    if (event?.type !== RRWEB_INCREMENTAL || event.data?.source !== MUTATION_SOURCE) return;

    (Array.isArray(event.data.removes) ? event.data.removes : []).forEach(removal => {
      const parent = state.nodes.get(removal?.parentId);
      if (parent) parent.childNodes = parent.childNodes.filter(childId => childId !== removal?.id);
      removeTree(state, removal?.id);
    });
    (Array.isArray(event.data.adds) ? event.data.adds : []).forEach(add => {
      indexTree(state, add?.node, add?.parentId);
      const parent = state.nodes.get(add?.parentId);
      if (parent && Number.isFinite(add?.node?.id) && !parent.childNodes.includes(add.node.id)) {
        parent.childNodes.push(add.node.id);
      }
    });
    (Array.isArray(event.data.attributes) ? event.data.attributes : []).forEach(change => {
      const node = state.nodes.get(change?.id);
      if (!node || !change?.attributes || typeof change.attributes !== 'object') return;
      Object.entries(change.attributes).forEach(([name, value]) => {
        if (value === null || value === false) delete node.attributes[name];
        else node.attributes[name] = value;
      });
    });
    (Array.isArray(event.data.texts) ? event.data.texts : []).forEach(change => {
      const node = state.nodes.get(change?.id);
      if (node && typeof change.value === 'string') {
        node.textContent = change.value;
        state.mutatedTextNodes.add(node.id);
      }
    });
  };

  const resolve = nodeId => {
    const original = state.nodes.get(nodeId);
    if (!original) return unresolvedReplayElement();
    const findInteractiveAncestor = candidate => {
      if (!candidate || isInteractiveNode(candidate)) return candidate;
      const parent = state.nodes.get(state.parents.get(candidate.id));
      if (!parent || candidate.type === RRWEB_DOCUMENT_NODE || !sameReplayRoot(candidate, parent)) {
        return candidate;
      }
      return findInteractiveAncestor(parent);
    };
    const candidate = findInteractiveAncestor(original);
    const interactiveTargetResolved = isInteractiveNode(candidate);
    const meaningful = interactiveTargetResolved ? candidate : original;
    const name = getElementName(state, meaningful);
    return {
      ...name,
      role: getReplayElementRole(meaningful),
      nodeResolved: true,
      interactiveTargetResolved,
      climbed: meaningful.id !== original.id
    };
  };

  return { processEvent, resolve, state };
};

export const resolveReplayElementAtEvent = (events, eventIndex, nodeId) => {
  const resolver = createReplayElementResolver();
  const list = Array.isArray(events) ? events : [];
  const lastIndex = Math.min(Number.isFinite(eventIndex) ? eventIndex : list.length - 1, list.length - 1);
  list.slice(0, lastIndex + 1).forEach(resolver.processEvent);
  return resolver.resolve(nodeId);
};
