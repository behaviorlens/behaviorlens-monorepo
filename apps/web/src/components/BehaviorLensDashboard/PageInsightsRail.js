import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  MenuItem,
  MenuItemButton,
  MenuItemTitle,
  MenuList
} from '../../ui';
import { IconChevronDown } from '../../ui/icons';
import {
  ClickListGroupLabel,
  ClickListHead,
  ClickListRank,
  ClickListRow,
  ClickListSelectionSummary,
  ClickMapEyebrow,
  ClickMapHeadline,
  ClickMapPanelCard,
  ClickMapPanelHeader,
  ClickMapPanelTitle,
  ClickMapRageToggleControl,
  ClickMapRageToggleInput,
  ClickMapRageToggleLabel,
  ClickMapRailLayout,
  InsightsCard,
  InsightsListFade,
  InsightsListViewport,
  InsightsRailBody,
  InsightsSectionLabel,
  InspectTargetLabel,
  InspectTargetList,
  InsightsMenu,
  InsightsStateBody,
  PageScopeCard,
  TimestampChip,
  TimestampChipRow
} from './ScBehaviorLensPageInsights';
import InsightsModeTabs, {
  INSIGHTS_MODE_CLICK_MAPS,
  INSIGHTS_MODE_INSPECT,
  INSIGHTS_MODE_SCROLL_MAPS
} from './InsightsModeTabs';
import { HEATMAP_FILTER_ALL, HEATMAP_FILTER_RAGE } from './behaviorLensHeatmap';
import { formatClickShare } from './behaviorLensClickMap';
import ScrollMapRail from './ScrollMapRail';
import InspectModeRail from './InspectModeRail';
import { formatReplayTimestamp } from './behaviorLensNoteTimestamps';
import useScrollEdgeFades from './useScrollEdgeFades';

const formatCount = value => Number(value || 0).toLocaleString('en-US');

// Page scope selector. A recording with one reconstructed document needs no
// duplicate URL row; the URL is already visible above the stage.
const PageViewPicker = ({ onPageViewChange, pageView, pageViews }) => {
  if (pageViews.length <= 1) {
    return null;
  }
  return (
    <>
      <InsightsSectionLabel style={{ marginBottom: 8 }}>Page view</InsightsSectionLabel>
      <InsightsMenu
        placement="bottom-start"
        theme="light"
        triggerElement={isOpen => (
          <Button
            type="button"
            colorStyle="secondary"
            variant="outline"
            endIcon={IconChevronDown}
            aria-expanded={isOpen}
            aria-label="Page view analysed by Page Insights"
            data-testid="behaviorlens-page-view-select"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            {pageView ? `${pageView.rank}. ${pageView.label}` : 'Select a page view'}
          </Button>
        )}
      >
        <MenuList style={{ width: '100%' }}>
          {pageViews.map(item => (
            <MenuItem key={item.id}>
              <MenuItemButton
                type="button"
                style={{ fontWeight: item.id === pageView?.id ? 600 : 400 }}
                onClick={() => onPageViewChange(item.id)}
                closeMenuOnClick
              >
                <MenuItemTitle>
                  {`${item.rank}. ${item.label} · ${formatCount(item.clickCount)} clicks`}
                </MenuItemTitle>
              </MenuItemButton>
            </MenuItem>
          ))}
        </MenuList>
      </InsightsMenu>
    </>
  );
};

PageViewPicker.defaultProps = { pageView: null };
PageViewPicker.propTypes = {
  onPageViewChange: PropTypes.func.isRequired,
  pageView: PropTypes.object,
  pageViews: PropTypes.array.isRequired
};

// Every clicked element of the page view, written out directly with its click
// times beside it. Elements the map can draw come first, numbered like their
// bubbles; clicks on elements not on the page at this frame follow, unnumbered. A time seeks this stage — Page Insights keeps
// its own playback, so reading a click never throws the reviewer back to
// Session Replay. The element row selects the hotspot the map already numbers.
const ClickListPanel = ({
  onFilterChange, onSeek, onSelectHotspot, rage, rows, selectedHotspotId, totalClicks
}) => {
  const selectedRowRef = useRef(null);
  const visibleRows = [...rows.drawn, ...rows.undrawn];
  const firstUndrawnId = rows.undrawn[0]?.id;
  const total = visibleRows.length;
  const scrollContentKey = visibleRows.map(row => `${row.id}:${row.times.length}`).join('|');
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(scrollContentKey);

  // A hotspot selected on the page can be far below the rail's current
  // position. Reveal its matching row without pulling an already-visible row
  // away from where the reviewer is reading.
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'nearest'
    });
  }, [selectedHotspotId]);

  return (
    <ClickMapPanelCard
      id="behaviorlens-click-list-card"
      data-testid="behaviorlens-click-list-card"
      $scrollable
    >
      <ClickMapPanelHeader>
        <ClickMapPanelTitle>
          <ClickMapEyebrow>Interaction Overview</ClickMapEyebrow>
          <ClickMapHeadline>
            {`Clicked Elements · ${total.toLocaleString('en-US')}`}
          </ClickMapHeadline>
        </ClickMapPanelTitle>
        <ClickMapRageToggleLabel>
          <ClickMapRageToggleInput
            type="checkbox"
            checked={rage}
            onChange={event => onFilterChange(
              event.target.checked ? HEATMAP_FILTER_RAGE : HEATMAP_FILTER_ALL
            )}
          />
          <ClickMapRageToggleControl $checked={rage} aria-hidden="true" />
          <span>Only Rage Clicks</span>
        </ClickMapRageToggleLabel>
      </ClickMapPanelHeader>
      {total === 0 ? (
        <InsightsStateBody data-testid="behaviorlens-click-list-empty">
          {rage
            ? 'No rage click was recorded in this frame.'
            : 'No click was recorded in this frame.'}
        </InsightsStateBody>
      ) : (
        <InsightsListViewport>
          <InspectTargetList ref={scrollRef} data-testid="behaviorlens-click-list" $compact>
            {visibleRows.map(row => {
              const selected = row.clickable && row.id === selectedHotspotId;
              const share = selected ? formatClickShare(row.count, totalClicks) : '';
              return (
                <React.Fragment key={row.id}>
                {row.id === firstUndrawnId && (
                  <ClickListGroupLabel data-testid="behaviorlens-click-list-undrawn-label">
                    Not on the page at this frame
                  </ClickListGroupLabel>
                )}
                <ClickListRow
                  ref={selected ? selectedRowRef : null}
                  $active={selected}
                  $rage={rage}
                  $muted={!row.clickable}
                  data-testid="behaviorlens-click-list-row"
                >
                  <div data-testid={selected ? 'behaviorlens-selected-hotspot' : undefined}>
                    <ClickListHead
                      as={row.clickable ? 'button' : 'div'}
                      type={row.clickable ? 'button' : undefined}
                      $ranked={Number.isFinite(row.rank)}
                      $static={!row.clickable}
                      aria-pressed={row.clickable ? selected : undefined}
                      onClick={row.clickable
                        ? () => onSelectHotspot(selected ? null : row.id)
                        : undefined}
                    >
                      {Number.isFinite(row.rank) && (
                      <ClickListRank $active={selected} $rage={rage}>{row.rank}</ClickListRank>
                      )}
                      {/* The chips below preserve every click moment; the
                        compact tally is added only while this row is selected. */}
                      <InspectTargetLabel $active={selected} title={row.label}>
                        {row.label}
                      </InspectTargetLabel>
                    </ClickListHead>
                    <TimestampChipRow $indent={Number.isFinite(row.rank)}>
                      {row.times.map(time => (
                        <TimestampChip
                          key={time.key}
                          type="button"
                          $rage={rage || time.isRageClick}
                          $selected={selected}
                          title={time.isRageClick
                            ? `${time.count} click${time.count === 1 ? '' : 's'}, including ${time.rageClickCount} rage — play from here`
                            : `${time.count} click${time.count === 1 ? '' : 's'} — play from here`}
                          onClick={() => onSeek(time.offset)}
                        >
                          {formatReplayTimestamp(time.offset)}
                          {time.count > 1 ? ` ×${time.count}` : ''}
                        </TimestampChip>
                      ))}
                      {selected && (
                      <ClickListSelectionSummary>
                        {`${formatCount(row.count)} clicks${share ? ` · ${share}` : ''}${
                          row.rageClickCount > 0
                            ? ` · ${formatCount(row.rageClickCount)} rage clicks`
                            : ''}`}
                      </ClickListSelectionSummary>
                      )}
                    </TimestampChipRow>
                  </div>
                </ClickListRow>
                </React.Fragment>
              );
            })}
          </InspectTargetList>
          <InsightsListFade
            aria-hidden="true"
            $edge="top"
            $height={36}
            $opacity={fadeTop}
          />
          <InsightsListFade
            aria-hidden="true"
            $edge="bottom"
            $height={36}
            $opacity={fadeBottom}
          />
        </InsightsListViewport>
      )}
    </ClickMapPanelCard>
  );
};

ClickListPanel.defaultProps = { selectedHotspotId: null, totalClicks: 0 };
ClickListPanel.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  onSeek: PropTypes.func.isRequired,
  onSelectHotspot: PropTypes.func.isRequired,
  rage: PropTypes.bool.isRequired,
  rows: PropTypes.object.isRequired,
  selectedHotspotId: PropTypes.string,
  totalClicks: PropTypes.number
};

const PageInsightsRail = ({
  activeMode,
  clickAnalysis,
  clickCountsByNode,
  clickList,
  filter,
  hoveredTargetNodeId,
  inspectTargets,
  onFilterChange,
  onHoverTarget,
  onModeChange,
  onPageViewChange,
  onSeek,
  onSelectHotspot,
  onSelectTarget,
  onSelectorModeChange,
  pageView,
  pageViews,
  scrollMap,
  selectedElement,
  selectedHotspot,
  selectorMode
}) => {
  const isRageView = filter === HEATMAP_FILTER_RAGE;
  return (
    <>
      <InsightsModeTabs
        activeAccent={activeMode === INSIGHTS_MODE_CLICK_MAPS ? '#104877' : undefined}
        activeMode={activeMode}
        onModeChange={onModeChange}
      />
      <InsightsRailBody
        $clickMap={activeMode === INSIGHTS_MODE_CLICK_MAPS}
        $inspect={activeMode === INSIGHTS_MODE_INSPECT}
      >
        {pageViews.length > 1 && pageView && (
        <PageScopeCard data-testid="behaviorlens-page-insights-scope">
          <PageViewPicker
            onPageViewChange={onPageViewChange}
            pageView={pageView}
            pageViews={pageViews}
          />
        </PageScopeCard>
        )}
        {!pageView && (
        <InsightsCard data-testid="behaviorlens-page-insights-scope">
          <InsightsStateBody style={{ marginTop: 10 }}>
            This recording contains no reconstructed page.
          </InsightsStateBody>
        </InsightsCard>
        )}
        {activeMode === INSIGHTS_MODE_CLICK_MAPS && (
        <ClickMapRailLayout>
          <ClickListPanel
            onFilterChange={onFilterChange}
            onSeek={onSeek}
            onSelectHotspot={onSelectHotspot}
            rage={isRageView}
            rows={clickList}
            selectedHotspotId={selectedHotspot?.id || null}
            totalClicks={clickAnalysis.totalClicks}
          />
        </ClickMapRailLayout>
        )}
        {activeMode === INSIGHTS_MODE_SCROLL_MAPS && (
        <ScrollMapRail scrollMap={scrollMap} />
        )}
        {activeMode === INSIGHTS_MODE_INSPECT && (
        <InspectModeRail
          clickCountsByNode={clickCountsByNode}
          hoveredNodeId={hoveredTargetNodeId}
          onHoverTarget={onHoverTarget}
          onSelectTarget={onSelectTarget}
          onSelectorModeChange={onSelectorModeChange}
          selectedElement={selectedElement}
          selectorMode={selectorMode}
          targets={inspectTargets}
        />
        )}
      </InsightsRailBody>
    </>
  );
};

PageInsightsRail.defaultProps = {
  hoveredTargetNodeId: null,
  pageView: null,
  selectedElement: null,
  selectedHotspot: null
};

PageInsightsRail.propTypes = {
  activeMode: PropTypes.string.isRequired,
  clickAnalysis: PropTypes.object.isRequired,
  clickCountsByNode: PropTypes.instanceOf(Map).isRequired,
  clickList: PropTypes.object.isRequired,
  filter: PropTypes.string.isRequired,
  hoveredTargetNodeId: PropTypes.number,
  inspectTargets: PropTypes.array.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onHoverTarget: PropTypes.func.isRequired,
  onModeChange: PropTypes.func.isRequired,
  onPageViewChange: PropTypes.func.isRequired,
  onSeek: PropTypes.func.isRequired,
  onSelectHotspot: PropTypes.func.isRequired,
  onSelectTarget: PropTypes.func.isRequired,
  onSelectorModeChange: PropTypes.func.isRequired,
  pageView: PropTypes.object,
  pageViews: PropTypes.array.isRequired,
  scrollMap: PropTypes.object.isRequired,
  selectedElement: PropTypes.object,
  selectedHotspot: PropTypes.object,
  selectorMode: PropTypes.string.isRequired
};

export default PageInsightsRail;
