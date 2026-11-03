import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../ui';
import {
  IconChevronDown,
  IconHouseFilled,
  IconNotificationTextFilled
} from '../ui/icons';
import SavedFiltersNavigation from './saved-filters/SavedFiltersNavigation';
import SavedFiltersDialogs from './saved-filters/SavedFiltersDialogs';
import { useBehaviorLensSavedFiltersContext } from './saved-filters/BehaviorLensSavedFiltersContext';
import {
  SHELL_COMPACT_MAX_WIDTH,
  BEHAVIORLENS_SHELL_COLUMN_GAP,
  BEHAVIORLENS_SHELL_PADDING_X,
  BEHAVIORLENS_SHELL_SIDEBAR_INSET,
  useCompactShellNav
} from './useCompactShellNav';

const PRIMARY_NAVIGATION = [
  {
    label: 'Sessions', path: '/app', icon: IconHouseFilled, exact: true
  }
];

const SECONDARY_NAVIGATION_GROUPS = [
  [
    {
      label: 'Mentions & Notes',
      path: '/app/mentions-and-notes',
      icon: IconNotificationTextFilled
    }
  ]
];

const COMPACT_NAVIGATION_ID = 'behaviorlens-shell-navigation';
const COMPACT_MEDIA = `@media (max-width: ${SHELL_COMPACT_MAX_WIDTH}px)`;

const findNavigationIcon = label => [
  ...PRIMARY_NAVIGATION,
  ...[].concat(...SECONDARY_NAVIGATION_GROUPS)
].find(item => item.label === label)?.icon;

const ShellViewport = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: calc(100vh - 72px);
  max-height: 100%;
  min-height: 0;
  overflow: hidden;

  ${COMPACT_MEDIA} {
    height: auto;
    max-height: none;
    min-height: calc(100vh - 72px);
    overflow: visible;
  }
`;

const Shell = styled.div.attrs({
  'data-behaviorlens-shell': ''
})`
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  display: grid;
  grid-template-columns: 243px minmax(0, 1fr);
  align-items: stretch;
  gap: ${BEHAVIORLENS_SHELL_COLUMN_GAP}px;
  padding: ${BEHAVIORLENS_SHELL_PADDING_X}px;
  background: rgba(248, 250, 251, 0.98);
  overflow: hidden;

  ${COMPACT_MEDIA} {
    height: auto;
    min-height: calc(100vh - 72px);
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 12px;
    overflow: visible;
  }
`;

const getCompactSidebarPadding = ({ $compact, $expanded }) => {
  if (!$compact) {
    return `${BEHAVIORLENS_SHELL_SIDEBAR_INSET}px 16px`;
  }

  return $expanded ? '8px 8px 16px' : '8px';
};

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  padding: ${BEHAVIORLENS_SHELL_SIDEBAR_INSET}px 16px;
  overflow: hidden;
  border: 1px solid rgba(232, 232, 232, 0.8);
  border-radius: 16px;
  background: #fefeff;
  box-shadow: 0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04);

  ${COMPACT_MEDIA} {
    height: auto;
    /* Stacked above the page the card is a header bar, so it keeps the nav
       padding only while the collapsible navigation is open. The bar itself
       never scrolls: Saved Filters sits last and its list absorbs extra rows. */
    padding: ${getCompactSidebarPadding};
    overflow: visible;
  }
`;

// The whole collapsed bar is the toggle: label on the left, chevron pinned right.
const CompactNavHeader = styled.div`
  flex: 0 0 auto;

  .bl-button {
    justify-content: flex-start;
    gap: 8px;
  }

  svg:last-of-type {
    margin-left: auto;
    transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
    transition: transform 120ms ease;
  }
`;

const NavigationRegion = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;

  &[hidden] {
    display: none;
  }

  ${COMPACT_MEDIA} {
    flex: 0 0 auto;
    margin-top: 8px;
  }
`;

const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 12px;
`;

const NavigationGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  gap: 12px;
`;

const NavigationLink = styled(NavLink)`
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border-radius: 8px;
  color: #0a1551;
  font-size: 16px;
  font-weight: 400;
  line-height: normal;
  text-decoration: none;
  transition: background-color 120ms ease, color 120ms ease;

  svg {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    color: currentColor;
  }

  &:hover {
    background: #f2f5fb;
  }

  &:focus-visible {
    outline: 2px solid #0075e3;
    outline-offset: 2px;
  }

  &.behaviorlens-navigation-active,
  &.behaviorlens-navigation-active:hover {
    color: #ffffff;
    background: #0075e3;
  }
`;

const Page = styled.main`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  padding: ${({ $flushPage }) => ($flushPage ? '2px 0 0' : '2px 6px 4px 0')};
  overflow-x: hidden;
  overflow-y: ${({ $flushPage }) => ($flushPage ? 'hidden' : 'auto')};

  ${COMPACT_MEDIA} {
    height: auto;
    padding: ${({ $flushPage }) => ($flushPage ? '2px 0 0' : '2px 6px 0 6px')};
    overflow: visible;
  }
`;

const PageTitle = styled.h1`
  flex: 0 0 auto;
  margin: 0 0 16px;
  color: #091551;
  font-size: 24px;
  font-weight: 700;
  line-height: 24px;
`;

const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
`;

const renderNavigationLink = (item, savedFilterSelected) => {
  const Icon = item.icon;
  return (
    <NavigationLink
      key={item.path}
      exact={item.exact}
      to={item.path}
      activeClassName="behaviorlens-navigation-active"
      isActive={match => Boolean(match) && !savedFilterSelected}
    >
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </NavigationLink>
  );
};

const BehaviorLensSidebar = ({
  compact, expanded, onToggleExpanded, savedFilterSelected, sidebarRef, title
}) => (
  <Sidebar ref={sidebarRef} $compact={compact} $expanded={expanded}>
    {compact && (
      <CompactNavHeader $expanded={expanded}>
        <Button
          fullWidth
          variant="ghost"
          colorStyle="secondary"
          startIcon={findNavigationIcon(title)}
          endIcon={IconChevronDown}
          aria-expanded={expanded}
          aria-controls={COMPACT_NAVIGATION_ID}
          onClick={onToggleExpanded}
        >
          {title}
        </Button>
      </CompactNavHeader>
    )}
    <NavigationRegion id={COMPACT_NAVIGATION_ID} hidden={compact && !expanded}>
      <Navigation aria-label="BehaviorLens navigation">
        <NavigationGroup>
          {PRIMARY_NAVIGATION.map(item => renderNavigationLink(item, savedFilterSelected))}
        </NavigationGroup>
        {SECONDARY_NAVIGATION_GROUPS.map(group => (
          <NavigationGroup key={group[0].path}>
            {group.map(item => renderNavigationLink(item, savedFilterSelected))}
          </NavigationGroup>
        ))}
        <SavedFiltersNavigation />
      </Navigation>
    </NavigationRegion>
  </Sidebar>
);

BehaviorLensSidebar.propTypes = {
  compact: PropTypes.bool.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
  savedFilterSelected: PropTypes.bool.isRequired,
  sidebarRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  title: PropTypes.string.isRequired
};

export const getBehaviorLensPageTitle = ({
  selectedSavedFilter, title, useSelectedSavedFilterTitle
}) => (
  useSelectedSavedFilterTitle && selectedSavedFilter?.name ? selectedSavedFilter.name : title
);

const BehaviorLensShellContent = ({
  children = null, flushPage = false, title, useSelectedSavedFilterTitle = false
}) => {
  const {
    compact, expanded, sidebarRef, toggleExpanded
  } = useCompactShellNav();
  const {
    savedFiltersLoading,
    selectedSavedFilter,
    selectedSavedFilterId
  } = useBehaviorLensSavedFiltersContext();
  const savedFilterSelected = Boolean(
    selectedSavedFilter || (savedFiltersLoading && selectedSavedFilterId)
  );
  const pageTitle = getBehaviorLensPageTitle({
    selectedSavedFilter,
    title,
    useSelectedSavedFilterTitle
  });

  return (
    <ShellViewport>
      <Shell>
        <BehaviorLensSidebar
          compact={compact}
          expanded={expanded}
          onToggleExpanded={toggleExpanded}
          savedFilterSelected={savedFilterSelected}
          sidebarRef={sidebarRef}
          title={title}
        />
        <Page $flushPage={flushPage}>
          <PageTitle>{pageTitle}</PageTitle>
          <PageBody>{children}</PageBody>
        </Page>
      </Shell>
    </ShellViewport>
  );
};

BehaviorLensShellContent.propTypes = {
  children: PropTypes.node,
  flushPage: PropTypes.bool,
  title: PropTypes.string.isRequired,
  useSelectedSavedFilterTitle: PropTypes.bool
};

const BehaviorLensShell = ({
  children = null, flushPage = false, title, useSelectedSavedFilterTitle = false
}) => (
  <>
    <BehaviorLensShellContent
      flushPage={flushPage}
      title={title}
      useSelectedSavedFilterTitle={useSelectedSavedFilterTitle}
    >
      {children}
    </BehaviorLensShellContent>
    <SavedFiltersDialogs />
  </>
);

BehaviorLensShell.propTypes = {
  children: PropTypes.node,
  flushPage: PropTypes.bool,
  title: PropTypes.string.isRequired,
  useSelectedSavedFilterTitle: PropTypes.bool
};

export default BehaviorLensShell;
