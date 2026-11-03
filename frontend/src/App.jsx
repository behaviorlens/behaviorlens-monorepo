import React, { useMemo } from 'react';
import {
  Redirect, Route, Switch, useLocation
} from 'react-router-dom';
import BehaviorLensMain from './dashboard';
import { UserContext } from './contexts/UserContext';

// Until Phase 2 adds accounts, the dashboard runs as one local demo reviewer.
const user = {
  username: import.meta.env.VITE_CURRENT_USERNAME || 'demo-reviewer',
  displayName: import.meta.env.VITE_CURRENT_DISPLAY_NAME || 'Demo Reviewer',
  avatarUrl: import.meta.env.VITE_CURRENT_AVATAR_URL || ''
};

const App = () => {
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get('embed') === '1';
  const userContext = useMemo(() => ({
    state: {
      auth: true,
      env: 'standalone',
      user
    }
  }), []);

  return (
    <UserContext.Provider value={userContext}>
      {!isEmbedded && (
        <header className="standalone-header">
          <a className="standalone-brand" href="/app" aria-label="Open BehaviorLens sessions">
            BehaviorLens
          </a>
          <span className="standalone-user">{user.displayName}</span>
        </header>
      )}
      <Switch>
        <Route path="/app" component={BehaviorLensMain} />
        <Redirect exact from="/" to="/app" />
        <Redirect to="/app" />
      </Switch>
    </UserContext.Provider>
  );
};

export default App;
