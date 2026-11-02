import React, { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  IconFormCodeFilled,
  IconWifi
} from '../../ui/icons';
import {
  DevToolsBody,
  DevToolsDrawerWrap,
  DevToolsFilterChip,
  DevToolsChipGroup,
  DevToolsFilterRow,
  DevToolsFilterSpacer,
  DevToolsGroupLabel,
  DevToolsHeader,
  DevToolsLevel,
  DevToolsNetworkGrid,
  DevToolsNetworkRow,
  DevToolsSearchField,
  DevToolsTab,
  DevToolsTabRow,
  DevToolsTelemetryList,
  DevToolsTelemetryRow,
  DevToolsTimestamp,
  UrlBarField,
  UrlBarPath,
  DevToolsWaterfall,
  DevToolsWaterfallBar,
  DevToolsWaterfallTrack
} from './ScBehaviorLensWorkspace';
import WorkspaceDevToolsSplitter, {
  DEFAULT_WORKSPACE_DEVTOOLS_HEIGHT,
  useWorkspaceDevToolsHeight
} from './WorkspaceDevToolsSplitter';

export const DEV_TOOLS_TAB_CONSOLE = 'console';
export const DEV_TOOLS_TAB_NETWORK = 'network';

const TABS = [
  {
    id: DEV_TOOLS_TAB_CONSOLE, label: 'Console', icon: IconFormCodeFilled, filters: ['All', 'Log', 'Info', 'Warning', 'Error', 'Exception']
  },
  {
    id: DEV_TOOLS_TAB_NETWORK, label: 'Network', icon: IconWifi, filters: ['All', 'XHR', 'JS', 'CSS', 'Media', 'Doc']
  }
];

const formatTime = value => {
  const seconds = Math.max(0, Number(value) || 0) / 1000;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}.${Math.floor((seconds % 1) * 10)}`;
};

const ConsoleRows = ({ rows, onSeek }) => (
  <DevToolsTelemetryList role="table" aria-label="Console entries">
    <DevToolsGroupLabel>Page console</DevToolsGroupLabel>
    {rows.map(row => (
      <DevToolsTelemetryRow
        key={row.id}
        role="row"
        type="button"
        $level={row.level}
        onClick={() => onSeek?.(row.timestampMs)}
      >
        <DevToolsTimestamp>{formatTime(row.timestampMs)}</DevToolsTimestamp>
        <DevToolsLevel $level={row.level}>{row.level}</DevToolsLevel>
        <span>{row.message}</span>
        <small>{`${row.source}:${row.line}`}</small>
      </DevToolsTelemetryRow>
    ))}
  </DevToolsTelemetryList>
);

ConsoleRows.defaultProps = { onSeek: null };
ConsoleRows.propTypes = { onSeek: PropTypes.func, rows: PropTypes.array.isRequired };

const NetworkRows = ({ rows, onSeek }) => {
  const maxEnd = Math.max(1, ...rows.map(row => row.startMs + row.durationMs));
  return (
    <DevToolsTelemetryList role="table" aria-label="Network entries">
      <DevToolsGroupLabel>Page requests</DevToolsGroupLabel>
      <DevToolsNetworkGrid aria-hidden="true">
        <span>Status</span>
        <span>Type</span>
        <span>Name</span>
        <span>Size</span>
        <span>Time / waterfall</span>
      </DevToolsNetworkGrid>
      {rows.map(row => (
        <DevToolsNetworkRow
          key={row.id}
          role="row"
          type="button"
          onClick={() => onSeek?.(row.timestampMs)}
        >
          <strong>{row.status}</strong>
          <span>{row.type.toUpperCase()}</span>
          <span title={row.name}>{row.name}</span>
          <span>{`${row.sizeKb} KB`}</span>
          <DevToolsWaterfall>
            <DevToolsWaterfallTrack>
              <DevToolsWaterfallBar
                $left={(row.startMs / maxEnd) * 100}
                $width={Math.max(2, (row.durationMs / maxEnd) * 100)}
              />
            </DevToolsWaterfallTrack>
            <small>{`${row.durationMs} ms`}</small>
          </DevToolsWaterfall>
        </DevToolsNetworkRow>
      ))}
    </DevToolsTelemetryList>
  );
};

NetworkRows.defaultProps = { onSeek: null };
NetworkRows.propTypes = { onSeek: PropTypes.func, rows: PropTypes.array.isRequired };

const DevToolsDrawer = ({
  defaultTab, onSeek, resizable, telemetry, url
}) => {
  const columnRef = useRef(null);
  const [storedHeight, setStoredHeight] = useWorkspaceDevToolsHeight();
  const drawerHeight = resizable ? storedHeight : DEFAULT_WORKSPACE_DEVTOOLS_HEIGHT;
  const [activeTab, setActiveTab] = useState(
    TABS.some(tab => tab.id === defaultTab) ? defaultTab : DEV_TOOLS_TAB_CONSOLE
  );
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const currentTab = TABS.find(tab => tab.id === activeTab) || TABS[0];
  const sourceRows = telemetry?.[activeTab] || [];
  const rows = useMemo(() => sourceRows.filter(row => {
    const category = activeTab === DEV_TOOLS_TAB_CONSOLE ? row.level : row.type;
    const matchesFilter = activeFilter === 'All'
      || String(category).toLowerCase() === activeFilter.toLowerCase();
    const haystack = activeTab === DEV_TOOLS_TAB_CONSOLE
      ? `${row.message} ${row.source} ${row.level}`
      : `${row.name} ${row.type} ${row.status}`;
    return matchesFilter && haystack.toLowerCase().includes(query.trim().toLowerCase());
  }), [activeFilter, activeTab, query, sourceRows]);

  const selectTab = tabId => {
    setActiveTab(tabId);
    setActiveFilter('All');
    setQuery('');
  };
  const assignWrap = node => {
    columnRef.current = node ? node.parentElement : null;
  };

  return (
    <DevToolsDrawerWrap
      ref={assignWrap}
      $resizable={resizable}
      data-testid="behaviorlens-devtools-drawer"
      style={{ '--behaviorlens-workspace-devtools-height': `${drawerHeight}px` }}
    >
      {resizable && (
        <WorkspaceDevToolsSplitter
          containerRef={columnRef}
          height={drawerHeight}
          onHeightChange={setStoredHeight}
        />
      )}
      <DevToolsHeader data-testid="behaviorlens-devtools-header">
        <DevToolsTabRow role="tablist" aria-label="Dev Tools">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <DevToolsTab
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                $active={activeTab === tab.id}
                onClick={() => selectTab(tab.id)}
              >
                <Icon aria-hidden="true" />
                {tab.label}
              </DevToolsTab>
            );
          })}
        </DevToolsTabRow>
        {url && (
          <UrlBarField
            as="a"
            data-testid="behaviorlens-devtools-url"
            href={url}
            rel="noopener noreferrer"
            style={{
              alignSelf: 'center', flex: '1 1 auto', marginRight: 16, minWidth: 0
            }}
            target="_blank"
            title={url}
          >
            <UrlBarPath>{url}</UrlBarPath>
          </UrlBarField>
        )}
      </DevToolsHeader>
      <DevToolsFilterRow>
        <DevToolsChipGroup aria-label={`${currentTab.label} filters`}>
          {currentTab.filters.map(filter => (
            <DevToolsFilterChip
              key={filter}
              type="button"
              $active={activeFilter === filter}
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </DevToolsFilterChip>
          ))}
        </DevToolsChipGroup>
        <DevToolsFilterSpacer />
        <DevToolsSearchField
          type="search"
          placeholder={`Filter ${currentTab.label.toLowerCase()}`}
          value={query}
          aria-label={`Filter ${currentTab.label.toLowerCase()} entries`}
          onChange={event => setQuery(event.target.value)}
        />
      </DevToolsFilterRow>
      <DevToolsBody>
        {activeTab === DEV_TOOLS_TAB_CONSOLE
          ? <ConsoleRows rows={rows} onSeek={onSeek} />
          : <NetworkRows rows={rows} onSeek={onSeek} />}
      </DevToolsBody>
    </DevToolsDrawerWrap>
  );
};

DevToolsDrawer.defaultProps = {
  defaultTab: DEV_TOOLS_TAB_CONSOLE,
  onSeek: null,
  resizable: true,
  telemetry: { console: [], network: [] },
  url: null
};

DevToolsDrawer.propTypes = {
  defaultTab: PropTypes.oneOf([DEV_TOOLS_TAB_CONSOLE, DEV_TOOLS_TAB_NETWORK]),
  onSeek: PropTypes.func,
  resizable: PropTypes.bool,
  telemetry: PropTypes.shape({ console: PropTypes.array, network: PropTypes.array }),
  url: PropTypes.string
};

export default DevToolsDrawer;
