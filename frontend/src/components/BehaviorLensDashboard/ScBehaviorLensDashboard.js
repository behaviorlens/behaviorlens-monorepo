import styled, { createGlobalStyle } from 'styled-components';
import { Link } from 'react-router-dom';
import { behaviorLensAiReviewPlayerStyles } from './behaviorLensAiReviewPlayerStyles';
import { behaviorLensPlaybackSpeedStyles } from './behaviorLensPlaybackSpeedStyles';
import { behaviorLensWorkspacePlayerStyles } from './behaviorLensWorkspacePlayerStyles';

export const Layout = styled.div`
  display: grid;
  /* Embedded: one definite row that fills the iframe (an auto row collapses and the flex player measures 0). */
  grid-template-rows: ${({ $embedded }) => ($embedded ? 'minmax(0, 1fr)' : 'auto 1fr auto')};
  height: ${({ $embedded }) => ($embedded ? '100vh' : 'calc(100vh - 72px)')};
  background: #f5f6f8;
`;

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e7ecf4;
`;

export const TopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

export const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const BackButton = styled(Link)`
  border: none;
  background: transparent;
  color: #334155;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  text-decoration: none;
`;

export const Title = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

export const Subtitle = styled.div`
  margin-top: 2px;
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

export const SessionChip = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #0f5fd6;
  background: #eaf2ff;
  border: 1px solid #cfe0ff;
  border-radius: 999px;
  padding: 6px 10px;
  max-width: 420px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

export const Body = styled.div`
  min-height: 0;
  display: grid;
  grid-template-columns: ${({ $embedded }) => ($embedded ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) 420px')};
  grid-template-rows: ${({ $aiReviewDashboardEmbed, $embedded }) => {
    if ($aiReviewDashboardEmbed) {
      return 'minmax(0, 1fr)';
    }
    return $embedded ? 'minmax(300px, 1fr) auto' : 'minmax(0, 1fr)';
  }};
  gap: ${({ $embedded }) => ($embedded ? '12px' : '16px')};
  padding: ${({ $aiReviewDashboardEmbed, $embedded }) => {
    if ($aiReviewDashboardEmbed) {
      return '0';
    }
    return $embedded ? '12px' : '18px 20px';
  }};
  overflow-x: hidden;
  overflow-y: ${({ $aiReviewDashboardEmbed, $embedded }) => (
    $embedded && !$aiReviewDashboardEmbed ? 'auto' : 'hidden'
  )};

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: ${({ $aiReviewDashboardEmbed }) => (
    $aiReviewDashboardEmbed ? 'minmax(0, 1fr)' : 'auto auto'
  )};
    overflow-y: ${({ $aiReviewDashboardEmbed }) => ($aiReviewDashboardEmbed ? 'hidden' : 'auto')};
  }
`;

export const ReplayColumn = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ $embedded }) => ($embedded ? '12px' : '16px')};
  overflow-x: hidden;
  overflow-y: ${({ $embedded }) => ($embedded ? 'visible' : 'hidden')};

  @media (max-width: 1180px) {
    overflow: visible;
  }
`;

export const ReplayPane = styled.div`
  position: ${({ $flush }) => ($flush ? 'relative' : 'static')};
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  border: ${({ $flush }) => ($flush ? '0' : '1px solid #e4e6ea')};
  border-radius: ${({ $flush }) => ($flush ? '0' : '12px')};
  background: ${({ $flush }) => ($flush ? 'transparent' : '#ffffff')};
  overflow: ${({ $flush }) => ($flush ? 'visible' : 'hidden')};
  box-shadow: ${({ $flush }) => ($flush ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.04)')};

  @media (max-width: 1180px) {
    min-height: min(70vh, 640px);
  }
`;

export const ReplayStage = styled.div`
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
`;

// Transparent click target over the replay so clicking the video toggles
// playback, the way any video player behaves. rrweb renders the recording in
// a sandboxed iframe, so its clicks never reach React — this layer sits above
// the iframe (z-index 4) but below the heatmap overlay (5) and the bookmark
// control (10). Keep the normal replay cursor even though the surface toggles
// playback; the labelled Play/Pause button and Space shortcut remain the
// visible, accessible affordances, so this layer is hidden from assistive tech
// and not focusable.
export const ReplayClickToggle = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  cursor: default;
`;

export const ReplayBookmarkOverlay = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
`;

export const ReplayViewBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  padding: 0 16px;
  border-bottom: 1px solid #eceef1;
  background: #ffffff;
`;

export const ReplayViewToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 600;
  line-height: 1rem;
  color: #1f2937;
  cursor: pointer;
`;

export const ReplayViewFilter = styled.div`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;

  .bl-segmented-control {
    flex-wrap: nowrap;
    align-items: center;
  }

  .bl-segmented-control label {
    height: 1rem;
    min-height: 1rem;
    padding-top: 0;
    padding-bottom: 0;
    font-size: 12px;
    line-height: 1rem;
  }

  .bl-segmented-control label > span {
    padding-left: 8px;
    padding-right: 8px;
  }
`;

export const ReplayPlayerMount = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  height: ${({ $embedded, $aiReviewDashboardEmbed }) => (
    $embedded && $aiReviewDashboardEmbed ? '100%' : ($embedded ? 'auto' : '100%')
  )};
  min-height: 0;
  border: none;
  background: ${({ $aiReviewDashboardEmbed }) => ($aiReviewDashboardEmbed ? '#ffffff' : '#f5f9ff')};
  overflow: hidden;
  ${({ $aiReviewDashboardEmbed, $embedded }) => ($aiReviewDashboardEmbed && $embedded ? `
    display: flex;
    flex-direction: column;
    min-height: 0;
  ` : '')}
`;

export const ReplayHeader = styled.div`
  height: 48px;
  border-bottom: 1px solid #eceef1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px;
`;

export const ReplayURL = styled.div`
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ReplayMeta = styled.div`
  font-size: 11px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  font-weight: 600;
`;

export const InsightsPane = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-x: hidden;
  overflow-y: ${({ $embedded }) => ($embedded ? 'visible' : 'hidden')};

  @media (max-width: 1180px) {
    overflow: visible;
  }
`;

export const InsightTabs = styled.div`
  flex: 0 0 auto;
  min-width: 0;
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f5f6f8;

  [role="tablist"] {
    overflow: hidden;
    height: auto;
    min-height: 3rem;
  }

  [role="tab"] {
    width: auto;
    min-width: 0;
    flex: 1 1 0;
    height: auto;
    padding: 8px 4px;
    white-space: normal;
    text-align: center;
    font-size: clamp(10px, 0.55vw + 8px, 13px);
    line-height: 1.25;
  }
`;

export const InsightTabPanels = styled.div`
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: ${({ $embedded }) => ($embedded ? 'visible' : 'auto')};

  @media (max-width: 1180px) {
    overflow: visible;
  }
`;

export const TimelineToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #6b7280;

  &:hover {
    color: #374151;
  }
`;

export const TimelineChevron = styled.span`
  display: inline-flex;
  transition: transform 150ms ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  font-size: 11px;
  color: #9ca3af;
`;

export const Card = styled.div`
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
`;

export const CardTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #6b7280;
`;

export const CollapsibleCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  ${CardTitle} {
    margin-bottom: 0;
  }
`;

export const CollapsibleCardBody = styled.div`
  margin-top: 16px;
`;

export const RailToolbar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
`;

export const EventSearch = styled.input`
  width: 100%;
  border: 1px solid #e1e3e8;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  color: #1f2937;
  background: #f8f9fa;
  transition: border-color 120ms ease, background-color 120ms ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #1463ff;
    background: #ffffff;
  }
`;

export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: ${({ $columns }) => ($columns === 3 ? '1fr 1fr 1fr' : '1fr 1fr')};
  gap: 8px;
  margin-bottom: 12px;
`;

const metricAccent = {
  default: '#1f2937',
  total: '#1463ff',
  active: '#0f9d58',
  completed: '#6366f1',
  events: '#d97706'
};

export const MetricCard = styled.div`
  border: 1px solid #ebedf0;
  border-radius: 8px;
  background: #fafbfc;
  padding: 8px 10px;
`;

export const MetricTitle = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 3px;
`;

export const MetricValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ $tone = 'default' }) => metricAccent[$tone] || metricAccent.default};
`;

export const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 8px;
  font-size: 12px;
  padding: 5px 0;
  border-top: 1px solid #f2f3f5;

  &:first-child {
    border-top: none;
    padding-top: 0;
  }
`;

export const MetaKey = styled.span`
  color: #9ca3af;
  font-weight: 500;
`;

export const MetaValue = styled.span`
  color: #1f2937;
  word-break: break-word;
`;

const frustrationAccent = {
  low: { color: '#0f9d58', background: '#e9f7ef' },
  medium: { color: '#b45309', background: '#fef3e2' },
  high: { color: '#dc2626', background: '#fdecec' }
};

export const FrustrationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
  color: ${({ $level = 'low' }) => (frustrationAccent[$level] || frustrationAccent.low).color};
  background: ${({ $level = 'low' }) => (frustrationAccent[$level] || frustrationAccent.low).background};
`;

export const SparklineLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #9ca3af;
  margin: 4px 0 2px;
`;

export const SparklineMount = styled.div`
  margin-bottom: 6px;
`;

export const CategoryChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
`;

export const CategoryChip = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#1463ff' : '#e1e3e8')};
  background: ${({ $active }) => ($active ? '#eaf1ff' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#1463ff' : '#4b5563')};
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  padding: 5px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;

  &:hover {
    border-color: #1463ff;
  }
`;

export const EventsList = styled.div`
  overflow: ${({ $preview }) => ($preview ? 'visible' : 'auto')};
  max-height: ${({ $embedded, $preview }) => {
    if ($preview) {
      return 'none';
    }
    return $embedded ? 'clamp(96px, 22vh, 220px)' : '520px';
  }};
  display: flex;
  flex-direction: column;
  margin: 0 -8px;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const EventItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 6px 15px;
  font-size: 13px;
  color: #1f2937;
  font-weight: ${({ $active }) => ($active ? '700' : '400')};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#eaf1ff' : 'transparent')};
  cursor: pointer;
  transition: background-color 120ms ease;

  /* Current-event gutter dot (reference: blue dot marking the playhead row). */
  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 50%;
    width: 6px;
    height: 6px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: ${({ $active }) => ($active ? '#1463ff' : 'transparent')};
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#eaf1ff' : '#f4f6f8')};
  }
`;

// Quiet event badge: neutral lavender keeps the rail scannable; rage clicks
// retain a subtle red treatment and a text tag, so color is not the only signal.
export const EventIcon = styled.span`
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: ${({ $rage }) => ($rage ? '#fff1f2' : '#f2f1ff')};
  color: ${({ $rage }) => ($rage ? '#DC2626' : '#6870b5')};

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const EventLabel = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const EventTag = styled.span`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #dc2626;
  background: #fdecec;
  padding: 2px 7px;
  border-radius: 999px;
  margin-right: 8px;
`;

export const EventTime = styled.span`
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

export const BottomBar = styled.div`
  background: #ffffff;
  border-top: 1px solid #e4e8f0;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  font-size: 14px;
  color: #475569;
`;

export const Placeholder = styled.div`
  padding: 16px;
  color: #64748b;
`;

export const ListLayout = styled.div`
  padding: 18px 20px;
`;

export const ListHeader = styled.div`
  margin-bottom: 16px;
  border-bottom: 1px solid #e4e8f0;
`;

export const ListTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 32px;
  line-height: 1.1;
  color: #0f172a;
`;

export const ListSubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 15px;
  color: #64748b;
`;

export const MetricSub = styled.div`
  margin-top: 3px;
  font-size: 11px;
  color: #707d9e;
`;

// rrweb-player ships its own controller stylesheet from the CDN, but it does
// not reliably apply (version drift / load order), leaving the controls as bare
// stacked text. We restyle the controller ourselves so it always looks clean.
// Scoped to .rr-player and marked !important to win over the CDN sheet if it
// does load. Class names follow rrweb-player's controller markup.
export const PlayerControllerStyles = createGlobalStyle`
  .rr-player {
    float: none !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    font-family: inherit !important;
  }

  .rr-controller {
    background: #ffffff !important;
    border-top: 1px solid #eceef1 !important;
    /* Tighter than rrweb's default so the 48px play button row fits the 80px controller reserves (otherwise it pokes into the audio strip below). */
    padding: 10px 16px 12px !important;
    box-sizing: border-box !important;
  }

  .rr-timeline {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
  }

  .rr-timeline__time {
    min-width: 44px !important;
    font-size: 12px !important;
    color: #6b7280 !important;
    font-variant-numeric: tabular-nums !important;
    text-align: center !important;
    display: inline-block !important;
  }

  .rr-progress {
    position: relative !important;
    flex: 1 1 auto !important;
    height: 8px !important;
    /* rrweb adds white top/bottom borders; at 8px they cover the whole track. */
    border: 0 !important;
    box-sizing: border-box !important;
    background: #9aa3b2 !important;
    border-radius: 999px !important;
    cursor: pointer !important;
    margin: 0 !important;
  }

  .rr-progress.disabled {
    cursor: not-allowed !important;
  }

  .rr-progress__step {
    height: 100% !important;
    background: #1463ff !important;
    border-radius: 999px !important;
  }

  .rr-progress__handler {
    width: 18px !important;
    height: 18px !important;
    top: 50% !important;
    border-radius: 50% !important;
    background: #1463ff !important;
    border: 3px solid #ffffff !important;
    box-shadow: 0 1px 4px rgba(16, 24, 40, 0.32) !important;
    margin-top: 0 !important;
    transform: translate(-50%, -50%) !important;
    z-index: 5 !important;
  }

  .rr-controller__btns {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  .rr-controller__btns button {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 40px !important;
    height: 40px !important;
    padding: 0 12px !important;
    border: none !important;
    border-radius: 8px !important;
    background: transparent !important;
    color: #374151 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: background-color 120ms ease, color 120ms ease !important;
  }

  .rr-controller__btns button:hover {
    background: #f1f3f5 !important;
  }

  /* Play/pause is the first button — make it the most prominent control. */
  .rr-controller__btns > button:first-of-type {
    min-width: 48px !important;
    height: 48px !important;
    background: #eaf1ff !important;
    color: #1463ff !important;
  }

  .rr-controller__btns > button:first-of-type:hover {
    background: #dbe8ff !important;
  }

  .rr-controller__btns button svg {
    width: 18px !important;
    height: 18px !important;
    fill: currentColor !important;
  }

  .rr-controller__btns > button:first-of-type svg {
    width: 24px !important;
    height: 24px !important;
  }

  .rr-controller__btns .switch {
    display: none !important;
  }

  ${behaviorLensPlaybackSpeedStyles}

  .behaviorlens-replay-warming .rr-controller__btns > button:first-of-type {
    position: relative !important;
    color: transparent !important;
    pointer-events: none !important;
    cursor: wait !important;
  }

  .behaviorlens-replay-warming .rr-controller__btns > button:first-of-type:hover {
    background: transparent !important;
  }

  .behaviorlens-replay-warming .rr-controller__btns > button:first-of-type > * {
    opacity: 0 !important;
  }

  .behaviorlens-replay-warming .rr-controller__btns > button:first-of-type::before {
    content: '' !important;
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    width: 22px !important;
    height: 22px !important;
    border: 3px solid #c7d7ff !important;
    border-top-color: #1463ff !important;
    border-radius: 50% !important;
    animation: behaviorlens-replay-warm-spin 800ms linear infinite !important;
  }

  @keyframes behaviorlens-replay-warm-spin {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }

    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  .rr-controller__btns button.active {
    background: #eaf1ff !important;
    color: #1463ff !important;
  }

  .rr-controller__btns label,
  .rr-controller__btns .label {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    font-size: 12px !important;
    color: #6b7280 !important;
    cursor: pointer !important;
    margin-left: 4px !important;
  }

  .rr-controller__btns input[type='checkbox'] {
    width: 14px !important;
    height: 14px !important;
    accent-color: #1463ff !important;
    cursor: pointer !important;
  }

  .rr-controller, .rr-timeline, .rr-progress {
    overflow: visible !important;
  }

  .rr-progress > div[title] {
    width: 4px !important;
    height: 14px !important;
    border-radius: 2px !important;
    z-index: 2 !important;
  }

  .rr-progress > div[title="behaviorlens-timeline-end"],
  .rr-progress > div[title="inactive period"],
  .rr-progress > div[title="behaviorlens-rage-click"] {
    display: none !important;
  }

  .rr-progress > div[title]::after {
    content: attr(title);
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    padding: 1px 5px;
    font-size: 9px;
    line-height: 1.5;
    font-weight: 600;
    white-space: nowrap;
    color: #1f2937;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #e1e3e8;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.12);
    pointer-events: none;
  }

  .rr-progress > div[title]:hover {
    z-index: 6 !important;
  }

  .rr-progress > div[title]:hover::after {
    background: #1f2937;
    color: #ffffff;
    border-color: #1f2937;
  }

  .behaviorlens-rage-zones {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
  }

  .behaviorlens-rage-zone {
    position: absolute;
    top: 0;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 2px;
    background: #dc2626;
    pointer-events: auto;
    cursor: pointer;
  }

  .behaviorlens-rage-zone:hover::after,
  .behaviorlens-rage-zone:focus-visible::after {
    content: "behaviorlens-rage-clicks";
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    padding: 1px 5px;
    border: 1px solid #e1e3e8;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.12);
    color: #1f2937;
    font-size: 9px;
    font-weight: 600;
    line-height: 1.5;
    white-space: nowrap;
    pointer-events: none;
  }

  ${({ $workspace }) => ($workspace ? behaviorLensWorkspacePlayerStyles : '')}

  ${({ $aiReviewDashboardEmbed }) => ($aiReviewDashboardEmbed ? behaviorLensAiReviewPlayerStyles : '')}
`;

// Display-only voice-recording strip: a static pseudo-waveform whose "played"
// portion is revealed as the replay advances. pointer-events are disabled — it
// is a slave to the rrweb-player clock, never a transport the reviewer drives.
