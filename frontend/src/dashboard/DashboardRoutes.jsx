import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import SessionListPage from './sessions/SessionListPage';
import SessionDetailPage from './workspace/SessionDetailPage';
import SharedWithMePage from './notes/SharedWithMePage';
import BehaviorLensShell from './BehaviorLensShell';
import { BehaviorLensSavedFiltersProvider } from './saved-filters/BehaviorLensSavedFiltersContext';

const SHELL_PATHS = ['/app', '/app/mentions-and-notes'];

const SHELL_TITLES = {
  '/app/mentions-and-notes': 'Mentions & Notes'
};

const BehaviorLensShellRoutes = () => {
  const { pathname } = useLocation();
  const onMentionsPage = pathname === '/app/mentions-and-notes';
  const title = SHELL_TITLES[pathname] || 'Sessions';

  return (
    <BehaviorLensSavedFiltersProvider>
      <BehaviorLensShell
        flushPage={onMentionsPage}
        title={title}
        useSelectedSavedFilterTitle={title === 'Sessions'}
      >
        <Switch>
          <Route exact path="/app" component={SessionListPage} />
          <Route exact path="/app/mentions-and-notes" component={SharedWithMePage} />
        </Switch>
      </BehaviorLensShell>
    </BehaviorLensSavedFiltersProvider>
  );
};

const DashboardRoutes = () => {
  return (
    <Switch>
      <Route exact path={SHELL_PATHS} component={BehaviorLensShellRoutes} />
      <Route path="/app/:sessionId" component={SessionDetailPage} />
    </Switch>
  );
};

export default DashboardRoutes;
