import { useCallback, useEffect, useState } from 'react';
import { listSessions } from '../../services/BehaviorLensService';
import { buildSavedFilterFilters } from '../saved-filters/behaviorLensSavedFilters';

// The reference rail shows "‹ 4 of 14.1K ›" over a Recent Sessions list. We
// derive the same position from the real session list the reviewer arrived
// from (the `returnTo` query carries their filters), using the existing
// listSessions request — no new endpoint, no fabricated totals.
//
// When the list cannot be loaded, or the current session is not part of it
// (for example a direct link), the header renders an honest unavailable
// state instead of a made-up count.
const NAVIGATION_PAGE_SIZE = 50;

const getListItemId = item => item?.id;

export const getReturnToSearch = returnTo => {
  if (typeof returnTo !== 'string') {
    return '';
  }
  const queryIndex = returnTo.indexOf('?');
  return queryIndex === -1 ? '' : returnTo.slice(queryIndex + 1);
};

// "4 of 14.1K" — the reference abbreviates large totals.
export const formatSessionTotal = total => {
  const value = Number(total);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  if (value < 1000) {
    return String(value);
  }
  if (value < 1000000) {
    const thousands = value / 1000;
    return `${thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, '') : Math.round(thousands)}K`;
  }
  const millions = value / 1000000;
  return `${millions < 10 ? millions.toFixed(1).replace(/\.0$/, '') : Math.round(millions)}M`;
};

const buildNeighbour = item => {
  const id = getListItemId(item);
  if (!id) {
    return null;
  }
  return {
    session: item,
    sessionId: id
  };
};

const useRecentSessionNavigation = ({ enabled, returnTo, sessionId }) => {
  const [state, setState] = useState({
    error: false,
    loading: Boolean(enabled),
    next: null,
    position: null,
    previous: null,
    total: null
  });

  useEffect(() => {
    if (!enabled || !sessionId) {
      setState({
        error: false, loading: false, next: null, position: null, previous: null, total: null
      });
      return undefined;
    }

    let active = true;
    // Never leave neighbours from the previous route clickable while the next
    // session list is resolving. Doing so can send a rapid pager sequence back
    // to a stale session and mount two player lifecycles against one route.
    setState({
      error: false, loading: true, next: null, position: null, previous: null, total: null
    });

    const filters = buildSavedFilterFilters(getReturnToSearch(returnTo));
    listSessions(NAVIGATION_PAGE_SIZE, 0, filters)
      .then(response => {
        if (!active) {
          return;
        }
        const sessions = Array.isArray(response?.sessions) ? response.sessions : [];
        const index = sessions.findIndex(item => getListItemId(item) === sessionId);
        if (index === -1) {
          // The session is not part of the reviewer's current list, so there
          // is no honest position to show.
          setState({
            error: false, loading: false, next: null, position: null, previous: null, total: null
          });
          return;
        }
        const total = Number(response?.total);
        setState({
          error: false,
          loading: false,
          next: index < sessions.length - 1 ? buildNeighbour(sessions[index + 1]) : null,
          position: index + 1,
          previous: index > 0 ? buildNeighbour(sessions[index - 1]) : null,
          total: Number.isFinite(total) && total > 0 ? total : sessions.length
        });
      })
      .catch(() => {
        if (active) {
          setState({
            error: true, loading: false, next: null, position: null, previous: null, total: null
          });
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, returnTo, sessionId]);

  const getPositionLabel = useCallback(() => {
    if (state.position === null || state.total === null) {
      return null;
    }
    const total = formatSessionTotal(state.total);
    return total ? `${state.position} of ${total}` : null;
  }, [state.position, state.total]);

  return { ...state, getPositionLabel };
};

export default useRecentSessionNavigation;
