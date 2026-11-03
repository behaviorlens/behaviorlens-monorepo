import { BEHAVIORLENS_SESSION_TAGS } from '../../services/BehaviorLensService';

export const TAGS_PARAM = 'tags';

// Wording and colors for the fixed Intern tag allowlist; the Filters popup
// options, session-detail Tags picker, and playlist row tags share this
// presentation.
export const SESSION_TAG_PRESENTATION = {
  bug: {
    background: '#fee8e8', border: '#fcc8c8', color: '#d32f2f', label: 'Bug'
  },
  'ux-issue': {
    background: '#f2edfe', border: '#d9cbfc', color: '#7c49d8', label: 'UX issue'
  },
  'rage-click': {
    background: '#e7edff', border: '#c7d4fe', color: '#4276ff', label: 'Rage click'
  },
  'follow-up': {
    background: '#f1f2f5', border: '#d9dbe1', color: '#6d7381', label: 'Follow up'
  },
  important: {
    background: '#fff2e0', border: '#fcd8a5', color: '#bf7116', label: 'Important'
  },
  'false-positive': {
    background: '#feecec', border: '#f2bfbf', color: '#b33232', label: 'False positive'
  }
};

export const SESSION_TAG_FILTERS = BEHAVIORLENS_SESSION_TAGS.map(tag => ({
  value: tag,
  ...SESSION_TAG_PRESENTATION[tag]
}));

export const readTagFilters = search => {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const selected = new Set((params.get(TAGS_PARAM) || '').split(',').map(value => value.trim()));
  return BEHAVIORLENS_SESSION_TAGS.filter(tag => selected.has(tag));
};

// Any comma list becomes the allowlisted tags in allowlist order, matching
// what readTagFilters would return for the same URL value.
export const normalizeTagFilterValue = value => {
  const selected = new Set(String(value || '').split(',').map(part => part.trim()));
  return BEHAVIORLENS_SESSION_TAGS.filter(tag => selected.has(tag)).join(',');
};

// A session must carry every selected tag, matching how the Review panel
// treats tags as additive labels rather than alternatives.
export const matchesTagFilters = (tags, activeTags) => (
  activeTags.every(tag => (Array.isArray(tags) ? tags : []).includes(tag))
);
