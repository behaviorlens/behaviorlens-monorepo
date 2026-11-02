// Honest element labels for clicked nodes, derived only from attributes the
// recording actually captured.
//
// rrweb click events carry the node id of the clicked element. Those ids are
// resolved against the recording's own DOM: the initial full snapshot plus
// every node added by later mutations (clicked elements are frequently added
// after load, so the snapshot alone resolves very few of them).
//
// IMPORTANT: rrweb node ids are session-local. They are stable within one
// recording and must never be treated as a cross-session element identity.
// Nothing here invents a selector or a friendly name — when the recording has
// no usable attribute we fall back to the tag name, and finally to a plain
// region label.

const RRWEB_FULL_SNAPSHOT = 2;
const RRWEB_INCREMENTAL = 3;
const MUTATION_SOURCE = 0;

export const readAttribute = (node, name) => {
  const value = node?.attributes?.[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const firstClassName = node => {
  const className = readAttribute(node, 'class');
  if (!className) {
    return null;
  }
  // Ignore utility-soup by taking the first meaningful token only.
  const token = className.split(/\s+/u).find(part => part.length > 1);
  return token || null;
};

export const readNodeText = node => {
  const pieces = [];
  const visit = current => {
    if (!current || pieces.join(' ').length > 100) {
      return;
    }
    if (typeof current.textContent === 'string') {
      pieces.push(current.textContent);
    }
    if (Array.isArray(current.childNodes)) {
      current.childNodes.forEach(visit);
    }
  };
  visit(node);
  const text = pieces.join(' ').replace(/\s+/gu, ' ').trim();
  return text && text.length <= 80 ? text : null;
};

export const indexNode = (node, index) => {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Number.isFinite(node.id)) {
    index.set(node.id, node);
  }
  const children = node.childNodes;
  if (Array.isArray(children)) {
    children.forEach(child => indexNode(child, index));
  }
};

// Builds nodeId -> snapshot node for one recording.
export const buildReplayNodeIndex = events => {
  const index = new Map();
  const list = Array.isArray(events) ? events : [];

  list.forEach(event => {
    if (event?.type === RRWEB_FULL_SNAPSHOT) {
      indexNode(event.data?.node, index);
      return;
    }
    if (event?.type === RRWEB_INCREMENTAL && event.data?.source === MUTATION_SOURCE) {
      const adds = event.data?.adds;
      if (Array.isArray(adds)) {
        adds.forEach(add => indexNode(add?.node, index));
      }
    }
  });

  return index;
};

// Preference order reflects how identifying each attribute actually is.
export const describeReplayNode = node => {
  if (!node) {
    return null;
  }
  const tagName = typeof node.tagName === 'string' ? node.tagName.toLowerCase() : null;

  const elementId = readAttribute(node, 'id');
  if (elementId) {
    return `#${elementId}`;
  }

  const ariaLabel = readAttribute(node, 'aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }

  const role = readAttribute(node, 'role');
  if (role && tagName) {
    return `${tagName}[role="${role}"]`;
  }

  const name = readAttribute(node, 'name');
  if (name) {
    return `${tagName || 'element'}[name="${name}"]`;
  }

  const title = readAttribute(node, 'title');
  if (title) {
    return title;
  }

  const dataAttribute = ['data-testid', 'data-test', 'data-qa', 'data-cy']
    .map(attribute => ({ attribute, value: readAttribute(node, attribute) }))
    .find(candidate => candidate.value);
  if (dataAttribute && tagName) {
    return `${tagName}[${dataAttribute.attribute}="${dataAttribute.value}"]`;
  }

  // Captured text is often the most useful honest label for wrapper spans
  // around controls (for example “Basketball” or “Register”). Keep it short
  // so layout containers do not become enormous pseudo-labels.
  const text = readNodeText(node);
  if (text) {
    return text;
  }

  const className = firstClassName(node);
  if (className) {
    return `${tagName || ''}.${className}`;
  }

  return tagName;
};

// Same preference order, applied to a live node in the reconstructed
// document. Page Insights renders the real DOM, so an element's own
// attributes are the most reliable label available — the rrweb snapshot index
// only ever sees nodes that a snapshot or a mutation add carried.
// Visible text of a live element, with a space between separate text nodes.
export const readElementText = element => {
  const pieces = [];
  const visit = node => {
    if (node?.nodeType === 3) {
      const value = typeof node.nodeValue === 'string' ? node.nodeValue.trim() : '';
      if (value) {
        pieces.push(value);
      }
      return;
    }
    if (node?.nodeType !== 1) {
      return;
    }
    Array.from(node.childNodes || []).forEach(visit);
  };
  visit(element);
  return pieces.join(' ').replace(/\s+/gu, ' ').trim();
};

export const describeLiveElement = element => {
  if (element?.nodeType !== 1) {
    return null;
  }
  const read = name => {
    const value = element.getAttribute?.(name);
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };
  const tagName = typeof element.tagName === 'string' ? element.tagName.toLowerCase() : null;

  const elementId = read('id');
  if (elementId) {
    return `#${elementId}`;
  }
  const ariaLabel = read('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }
  const name = read('name');
  if (name) {
    return `${tagName || 'element'}[name="${name}"]`;
  }
  const dataAttribute = ['data-testid', 'data-test', 'data-qa', 'data-cy']
    .map(attribute => ({ attribute, value: read(attribute) }))
    .find(candidate => candidate.value);
  if (dataAttribute && tagName) {
    return `${tagName}[${dataAttribute.attribute}="${dataAttribute.value}"]`;
  }
  const title = read('title');
  if (title) {
    return title;
  }
  const placeholder = read('placeholder');
  if (placeholder) {
    return placeholder;
  }
  // textContent concatenates descendants with nothing between them, so a
  // control built from a label plus a description reads as one run-on word
  // ("ThemeSwitch the feed between…"). Join the real text nodes instead.
  const text = readElementText(element);
  if (text && text.length <= 80) {
    return text;
  }
  const role = read('role');
  if (role && tagName) {
    return `${tagName}[role="${role}"]`;
  }
  const className = typeof element.className === 'string'
    ? element.className.split(/\s+/u).find(token => token.length > 1)
    : null;
  if (className) {
    return `${tagName || ''}.${className}`;
  }
  return tagName;
};

export const REGION_LABEL_FALLBACK = 'Page region';

// Resolves a hotspot's representative click to a label. Returns both the
// label and whether it came from real element attributes, so the UI can be
// explicit when it is only showing a positional region.
export const getHotspotLabel = (hotspot, nodeIndex, liveElement = null) => {
  const live = describeLiveElement(liveElement);
  if (live) {
    return {
      fromElement: true,
      label: live,
      tagName: liveElement?.tagName ? liveElement.tagName.toLowerCase() : null
    };
  }

  const nodeId = hotspot?.targetId ?? hotspot?.representative?.nodeId;
  const node = Number.isFinite(nodeId) && nodeIndex ? nodeIndex.get(nodeId) : null;
  const described = describeReplayNode(node);

  if (described) {
    return { fromElement: true, label: described, tagName: node?.tagName || null };
  }

  return { fromElement: false, label: REGION_LABEL_FALLBACK, tagName: null };
};
