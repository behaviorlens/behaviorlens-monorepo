// Plain helpers for the Mentions & Notes page: date formatting, initials and
// the debounced search box state. Its components are in SharedWithMeComponents.js.
import { useEffect, useState } from 'react';

const QUERY_PARAM = 'q';
const SEARCH_DEBOUNCE_MS = 250;

// "12h ago" is enough to scan but useless for triage across days, so the exact
// moment is one hover — or one screen-reader stop — away. To the minute:
// seconds answer a question nobody asks of a comment and turn a date into a
// serial number ("01.09.2026 09:48:40").
export const formatAbsoluteTime = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).replace('Sept', 'Sep');
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  return `${datePart} ${timePart}`;
};

export const formatSessionStart = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace('Sept', 'Sep');
};

export const getInitials = value => String(value || '')
  .trim()
  .split(/\s+/u)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part.charAt(0).toUpperCase())
  .join('') || 'JS';

export const useSearchDraft = (query, updateParam) => {
  const [searchDraft, setSearchDraft] = useState(query);

  useEffect(() => setSearchDraft(query), [query]);

  useEffect(() => {
    if (searchDraft === query) return undefined;
    const timer = setTimeout(
      () => updateParam(QUERY_PARAM, searchDraft),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [query, searchDraft, updateParam]);

  return [searchDraft, setSearchDraft];
};
