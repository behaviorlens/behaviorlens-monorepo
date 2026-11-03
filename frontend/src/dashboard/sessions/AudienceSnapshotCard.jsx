import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import AudienceBrowserIcon from '../../assets/icons/behaviorlens-audience-browser.svg';
import AudienceBrowserOtherIcon from '../../assets/icons/behaviorlens-audience-browser-other.svg';
import AudienceChromeIcon from '../../assets/icons/behaviorlens-audience-chrome.svg';
import AudienceDesktopIcon from '../../assets/icons/behaviorlens-audience-desktop.svg';
import AudienceEdgeIcon from '../../assets/icons/behaviorlens-audience-edge.svg';
import AudienceMobileIcon from '../../assets/icons/behaviorlens-audience-mobile.svg';
import AudienceSafariIcon from '../../assets/icons/behaviorlens-audience-safari.svg';
import { aggregateAudienceSnapshot } from './behaviorLensAudienceSnapshot';
import {
  AudienceCard,
  AudienceColumn,
  AudienceColumns,
  AudienceDivider,
  AudienceGroupTitle,
  AudienceItemIcon,
  AudienceItemLabel,
  AudienceItemRow,
  AudienceItems,
  AudienceItemTop,
  AudienceProgress,
  AudienceProgressBar,
  AudienceState,
  ChartCardTitle
} from './ScBehaviorLensDashboardPage';

const getDeviceIcon = label => {
  if (label.startsWith('Mobile')) {
    return AudienceMobileIcon;
  }
  if (label.startsWith('Desktop')) {
    return AudienceDesktopIcon;
  }
  return AudienceBrowserIcon;
};

const getBrowserIcon = label => {
  if (label === 'Chrome') {
    return AudienceChromeIcon;
  }
  if (label === 'Edge') {
    return AudienceEdgeIcon;
  }
  if (label === 'Safari') {
    return AudienceSafariIcon;
  }
  return AudienceBrowserOtherIcon;
};

const AudienceRows = ({ getIcon, rows }) => (
  <AudienceItems>
    {rows.map(row => {
      const iconUrl = getIcon(row.label);
      return (
        <AudienceItemRow key={row.label}>
          <AudienceItemTop>
            <AudienceItemLabel>
              <AudienceItemIcon>
                <img src={iconUrl} alt="" aria-hidden="true" />
              </AudienceItemIcon>
              <span title={row.label}>{row.label}</span>
            </AudienceItemLabel>
            <strong>{`${row.percentage}%`}</strong>
          </AudienceItemTop>
          <AudienceProgress aria-hidden="true">
            <AudienceProgressBar $value={row.percentage} />
          </AudienceProgress>
        </AudienceItemRow>
      );
    })}
  </AudienceItems>
);

AudienceRows.propTypes = {
  getIcon: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    percentage: PropTypes.number.isRequired
  })).isRequired
};

const AudienceSnapshotCard = ({ loading = false, sessions = [] }) => {
  const snapshot = useMemo(() => aggregateAudienceSnapshot(sessions), [sessions]);

  return (
    <AudienceCard as="section">
      <ChartCardTitle>Audience Snapshot</ChartCardTitle>
      {loading && <AudienceState role="status">Loading Audience Snapshot...</AudienceState>}
      {!loading && snapshot.total === 0 && (
        <AudienceState>No audience data for the filtered sessions.</AudienceState>
      )}
      {!loading && snapshot.total > 0 && (
        <AudienceColumns>
          <AudienceColumn>
            <AudienceGroupTitle>Devices</AudienceGroupTitle>
            <AudienceRows rows={snapshot.devices} getIcon={getDeviceIcon} />
          </AudienceColumn>
          <AudienceDivider aria-hidden="true" />
          <AudienceColumn>
            <AudienceGroupTitle>Browsers</AudienceGroupTitle>
            <AudienceRows rows={snapshot.browsers} getIcon={getBrowserIcon} />
          </AudienceColumn>
        </AudienceColumns>
      )}
    </AudienceCard>
  );
};

AudienceSnapshotCard.propTypes = {
  loading: PropTypes.bool,
  sessions: PropTypes.array
};

export default AudienceSnapshotCard;
