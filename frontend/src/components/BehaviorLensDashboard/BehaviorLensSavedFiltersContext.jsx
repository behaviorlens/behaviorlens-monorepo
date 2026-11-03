import React, { createContext, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import useBehaviorLensSavedFilters from './useBehaviorLensSavedFilters';

export const SESSION_LIST_PATH = '/app';

const SavedFiltersContext = createContext(null);

// The Saved Filters list lives in the shell sidebar while the filters it
// restores belong to the session list, so the controller is shared through
// context and writes land on the session list route from anywhere.
export const BehaviorLensSavedFiltersProvider = ({ children = null }) => {
  const history = useHistory();
  const location = useLocation();
  const onSessionList = location.pathname === SESSION_LIST_PATH;

  const replaceSearchParams = useCallback(params => {
    const queryString = params.toString();
    const search = queryString ? `?${queryString}` : '';

    if (!onSessionList) {
      history.push({ pathname: SESSION_LIST_PATH, search });
      return;
    }
    if (search !== location.search) {
      history.replace({ pathname: location.pathname, search });
    }
  }, [history, location.pathname, location.search, onSessionList]);

  const controller = useBehaviorLensSavedFilters({
    urlSearch: onSessionList ? location.search : '',
    replaceSearchParams,
    syncUrl: onSessionList
  });

  return (
    <SavedFiltersContext.Provider value={controller}>
      {children}
    </SavedFiltersContext.Provider>
  );
};

BehaviorLensSavedFiltersProvider.propTypes = {
  children: PropTypes.node
};

export const useBehaviorLensSavedFiltersContext = () => useContext(SavedFiltersContext);
