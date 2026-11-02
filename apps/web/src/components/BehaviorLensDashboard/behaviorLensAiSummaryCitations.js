const CITATION_GROUP = /(?:\(\s*)?(?:\*{1,2})?\[(E[1-9][0-9]*(?:\s*,\s*E[1-9][0-9]*)*)\](?:\*{1,2})?(?:\s*\))?/gu;

const trimmedString = value => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const elementName = item => trimmedString(item?.element?.name);

const elementRole = item => {
  const role = trimmedString(item?.element?.role);
  return role && role !== 'unknown' ? role : null;
};

export const formatSemanticEvidenceLabel = item => {
  if (!item || typeof item !== 'object') return null;
  const name = elementName(item);
  const role = elementRole(item);
  const customLabel = trimmedString(item.label);

  switch (item.type) {
    case 'click':
      return name ? `Clicked ${name}` : role ? `Clicked ${role}` : 'Clicked page region';
    case 'input_sequence':
      return name ? `Typed in ${name}` : role ? `Typed in ${role}` : 'Typed in a field';
    case 'scroll_sequence': {
      const direction = item.direction === 'up' || item.direction === 'down'
        ? item.direction
        : null;
      if (direction && name) return `Scrolled ${direction} in ${name}`;
      if (direction) return `Scrolled ${direction}`;
      if (name) return `Scrolled ${name}`;
      return 'Scrolled';
    }
    case 'selection':
      return 'Selected text';
    case 'custom_event':
      return customLabel || trimmedString(item.tag) || 'Custom event';
    default:
      return name || customLabel || null;
  }
};

const parseActionLabel = label => {
  const match = /^(Clicked|Typed in|Scrolled down|Scrolled up|Scrolled|Selected)(?:\s+(.*))?$/u
    .exec(label);
  if (!match) return { verb: null, noun: label };
  const noun = trimmedString(match[2]);
  if (match[1] === 'Selected' && !noun) {
    return { verb: 'Selected', noun: 'text' };
  }
  return { verb: match[1], noun: noun || label };
};

// In a citation cluster, keep the verb on the first item of each action type
// ("Clicked Grid, List, Carousel") instead of repeating "Clicked" on every name.
export const compactCitationGroup = citations => {
  if (!Array.isArray(citations) || citations.length <= 1) {
    return Array.isArray(citations) ? citations : [];
  }
  let lastVerb = null;
  return citations.map(citation => {
    const { verb, noun } = parseActionLabel(citation.label);
    if (!verb || !noun || noun === citation.label) {
      lastVerb = null;
      return citation;
    }
    if (verb === lastVerb) {
      return { ...citation, label: noun };
    }
    lastVerb = verb;
    return { ...citation, label: `${verb} ${noun}` };
  });
};

export const buildEvidenceCitationLookup = timeline => {
  const lookup = {};
  (Array.isArray(timeline) ? timeline : []).forEach(item => {
    if (!/^E[1-9][0-9]*$/u.test(item?.id || '')) return;
    const label = formatSemanticEvidenceLabel(item);
    if (!label) return;
    lookup[item.id] = {
      label,
      atMs: Number.isFinite(item.atMs) ? item.atMs : null
    };
  });
  return lookup;
};

const uniqueResolvedCitations = (ids, lookup) => {
  const resolved = [];
  const seen = new Set();
  ids.forEach(id => {
    const entry = lookup?.[id];
    if (!entry?.label || seen.has(entry.label)) return;
    seen.add(entry.label);
    resolved.push({
      id,
      label: entry.label,
      atMs: Number.isFinite(entry.atMs) ? entry.atMs : null
    });
  });
  return resolved;
};

const cleanupParts = parts => {
  const merged = [];
  parts.forEach(part => {
    if (part.type === 'text') {
      const previous = merged[merged.length - 1];
      if (previous?.type === 'text') {
        previous.value += part.value;
        return;
      }
      merged.push({ type: 'text', value: part.value });
      return;
    }
    merged.push(part);
  });

  return merged.map((part, index) => {
    if (part.type !== 'text') return part;
    let { value } = part;
    value = value.replace(/[ \t]+([.,;:!?])/gu, '$1');
    value = value.replace(/[ \t]{2,}/gu, ' ');
    if (index === 0) value = value.replace(/^[ \t]+/u, '');
    if (index === merged.length - 1) value = value.replace(/[ \t]+$/u, '');
    return { type: 'text', value };
  }).filter(part => part.type !== 'text' || part.value !== '');
};

export const resolveCitationParts = (text, lookup) => {
  if (typeof text !== 'string' || text === '') return [];
  const parts = [];
  let lastIndex = 0;
  const pattern = new RegExp(CITATION_GROUP.source, 'gu');
  let match = pattern.exec(text);
  while (match) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const citations = compactCitationGroup(
      uniqueResolvedCitations(match[1].split(/\s*,\s*/u), lookup)
    );
    if (citations.length > 0) {
      parts.push({ type: 'citations', citations });
    }
    lastIndex = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return cleanupParts(parts);
};

const needsSpaceBefore = (result, chunk) => (
  Boolean(result) && !/[\s(]$/u.test(result) && !/^[\s.,;:!?)]/u.test(chunk)
);

export const replaceEvidenceCitations = (text, lookup) => {
  if (typeof text !== 'string') return '';
  let result = '';
  resolveCitationParts(text, lookup).forEach(part => {
    const chunk = part.type === 'text'
      ? part.value
      : part.citations.map(item => item.label).join(', ');
    if (!chunk) return;
    if (needsSpaceBefore(result, chunk)) result += ' ';
    result += chunk;
  });
  return result;
};
