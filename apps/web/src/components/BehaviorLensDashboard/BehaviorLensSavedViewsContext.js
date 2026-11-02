import React, { createContext, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import useBehaviorLensSavedViews from './useBehaviorLensSavedViews';

export const SESSION_LIST_PATH = '/app';

const SavedViewsContext = createContext(null);

// The Saved Filters list lives in the shell sidebar while the filters it
// restores belong to the session list, so the controller is shared through
// context and writes land on the session list route from anywhere.
export const BehaviorLensSavedViewsProvider = ({ children }) => {
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

  const controller = useBehaviorLensSavedViews({
    urlSearch: onSessionList ? location.search : '',
    replaceSearchParams,
    syncUrl: onSessionList
  });

  return (
    <SavedViewsContext.Provider value={controller}>
      {children}
    </SavedViewsContext.Provider>
  );
};

BehaviorLensSavedViewsProvider.propTypes = {
  children: PropTypes.node
};

BehaviorLensSavedViewsProvider.defaultProps = {
  children: null
};

export const useBehaviorLensSavedViewsContext = () => useContext(SavedViewsContext);
