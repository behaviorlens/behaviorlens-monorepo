import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import SessionListPage from './SessionListPage';
import SessionDetailPage from './SessionDetailPage';
import SharedWithMePage from './SharedWithMePage';
import BehaviorLensShell from './BehaviorLensShell';
import { BehaviorLensSavedViewsProvider } from './BehaviorLensSavedViewsContext';

const SHELL_PATHS = ['/app', '/app/mentions-and-notes'];

const SHELL_TITLES = {
  '/app/mentions-and-notes': 'Mentions & Notes'
};

const BehaviorLensShellRoutes = () => {
  const { pathname } = useLocation();
  const onMentionsPage = pathname === '/app/mentions-and-notes';
  const title = SHELL_TITLES[pathname] || 'Sessions';

  return (
    <BehaviorLensSavedViewsProvider>
      <BehaviorLensShell
        flushPage={onMentionsPage}
        title={title}
        useSelectedSavedViewTitle={title === 'Sessions'}
      >
        <Switch>
          <Route exact path="/app" component={SessionListPage} />
          <Route exact path="/app/mentions-and-notes" component={SharedWithMePage} />
        </Switch>
      </BehaviorLensShell>
    </BehaviorLensSavedViewsProvider>
  );
};

const Main = () => {
  return (
    <Switch>
      <Route exact path={SHELL_PATHS} component={BehaviorLensShellRoutes} />
      <Route path="/app/:sessionId" component={SessionDetailPage} />
    </Switch>
  );
};

export default Main;
