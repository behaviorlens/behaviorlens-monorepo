import React from 'react';
import PropTypes from 'prop-types';
import {
  IconAngleDown,
  IconBrowserFilled,
  IconClock,
  IconDesktop,
  IconGlobeArrowPointerSimpleFilled,
  IconKeyboard,
  IconLinkDiagonal
} from '../../ui/icons';
import {
  RailHeaderCard,
  RailHeaderDetailDivider,
  RailHeaderDetailLabel,
  RailHeaderDetailLink,
  RailHeaderDetailRow,
  RailHeaderDetails,
  RailHeaderDetailValue,
  RailHeaderDisclosure,
  RailHeaderIdentity,
  RailHeaderLine,
  RailHeaderName,
  RailHeaderStatus,
  RailHeaderTopRow
} from './ScBehaviorLensWorkspace';
import { describeUserAgent } from './behaviorLensUserAgent';

// Formats meta.started_at for the rail header; falls back to the raw value
// when it is not a parseable date.
const formatSessionStartedAt = value => {
  if (typeof value !== 'string' || !value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-US', {
    day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric'
  });
};

const hostnameFromUrl = value => {
  try {
    return new URL(value).hostname || '';
  } catch (error) {
    return '';
  }
};

const displayUrl = value => (
  typeof value === 'string' && value
    ? value.replace(/^https?:\/\//i, '')
    : '-'
);

const hrefFor = value => (
  typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null
);

const formatStatus = value => {
  const status = String(value || '').trim();
  return status && status !== '-'
    ? `${status.charAt(0).toUpperCase()}${status.slice(1)}`
    : '-';
};

const DetailRow = ({
  href, icon: Icon, iconSize, label, status, value
}) => (
  <RailHeaderDetailRow>
    <RailHeaderDetailLabel $iconSize={iconSize}>
      <Icon aria-hidden="true" />
      {label}
    </RailHeaderDetailLabel>
    {status ? (
      <RailHeaderStatus $complete={/complete/iu.test(String(value))}>
        {value}
      </RailHeaderStatus>
    ) : href ? (
      <RailHeaderDetailLink
        href={href} target="_blank" rel="noreferrer"
        title={value}
      >
        {displayUrl(value)}
      </RailHeaderDetailLink>
    ) : (
      <RailHeaderDetailValue title={value}>{value}</RailHeaderDetailValue>
    )}
  </RailHeaderDetailRow>
);

DetailRow.defaultProps = {
  href: null,
  iconSize: 16,
  status: false
};

DetailRow.propTypes = {
  href: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  iconSize: PropTypes.number,
  label: PropTypes.string.isRequired,
  status: PropTypes.bool,
  value: PropTypes.string.isRequired
};

// Figma's Session Summary is merged into the Activity Log disclosure. Values
// always come from the replay payload; unavailable geo data is never inferred.
const SessionRailHeader = ({
  detailsOpen,
  meta,
  onToggleDetails,
  stop,
  viewport
}) => {
  const startedAt = formatSessionStartedAt(meta.started_at);
  const deviceLabel = describeUserAgent(meta.user_agent);
  const ipAddress = typeof meta.ip_address === 'string' && meta.ip_address
    ? meta.ip_address
    : null;
  const pageLabel = meta.page_title || hostnameFromUrl(meta.url) || '-';
  const status = formatStatus(stop.status || meta.status);
  const viewportLabel = viewport?.width && viewport?.height
    ? `${viewport.width}×${viewport.height}`
    : '-';

  return (
    <RailHeaderCard data-testid="behaviorlens-rail-header">
      <RailHeaderIdentity>
        <RailHeaderTopRow>
          <RailHeaderName>{meta.username || 'Unknown user'}</RailHeaderName>
        </RailHeaderTopRow>
        <RailHeaderLine>
          {startedAt && <strong>{startedAt}</strong>}
          {deviceLabel && <span>{deviceLabel}</span>}
        </RailHeaderLine>
        <RailHeaderLine $compact aria-label={ipAddress ? `IP address ${ipAddress}` : undefined}>
          {ipAddress || '\u00a0'}
        </RailHeaderLine>
        <RailHeaderDisclosure
          type="button"
          aria-expanded={detailsOpen}
          onClick={onToggleDetails}
          data-testid="behaviorlens-rail-show-more"
        >
          {detailsOpen ? 'Show Less' : 'Show More'}
          <IconAngleDown aria-hidden="true" />
        </RailHeaderDisclosure>
      </RailHeaderIdentity>
      {detailsOpen && (
        <RailHeaderDetails data-testid="behaviorlens-rail-details">
          <DetailRow
            icon={IconClock}
            iconSize={14}
            label="Status"
            status
            value={status}
          />
          <DetailRow
            icon={IconGlobeArrowPointerSimpleFilled}
            iconSize={14}
            label="Page"
            value={pageLabel}
          />
          <DetailRow
            href={hrefFor(meta.referrer)}
            icon={IconLinkDiagonal}
            label="Referrer"
            value={meta.referrer || '-'}
          />
          <DetailRow
            href={hrefFor(meta.url)}
            icon={IconKeyboard}
            label="URL"
            value={meta.url || '-'}
          />
          <RailHeaderDetailDivider aria-hidden="true" />
          <DetailRow
            icon={IconBrowserFilled}
            label="Browser"
            value={deviceLabel || meta.user_agent || '-'}
          />
          <DetailRow
            icon={IconDesktop}
            label="Viewport"
            value={viewportLabel}
          />
        </RailHeaderDetails>
      )}
    </RailHeaderCard>
  );
};

SessionRailHeader.defaultProps = {
  viewport: null
};

SessionRailHeader.propTypes = {
  detailsOpen: PropTypes.bool.isRequired,
  meta: PropTypes.object.isRequired,
  onToggleDetails: PropTypes.func.isRequired,
  stop: PropTypes.object.isRequired,
  viewport: PropTypes.object
};

export default SessionRailHeader;
