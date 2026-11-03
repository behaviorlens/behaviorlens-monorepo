import React, {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '../../ui';
import { IconCheck, IconCopyFilled } from '../../ui/icons';
import {
  InsightsCard,
  InspectCardTitle,
  InspectMetricCard,
  InspectMetricLabel,
  InspectMetricValue,
  InspectSelectorCard,
  InspectTargetsCard,
  InsightsSectionLabel,
  InsightsStateBody,
  InspectTargetLabel,
  InspectTargetList,
  InspectTargetRow,
  InsightsListFade,
  InsightsListViewport,
  SelectedElementName,
  SelectorBox,
  SelectorCopyButton,
  SelectorModeButton,
  SelectorModeSwitch,
  SelectorText,
  SelectorTextSlot
} from './ScBehaviorLensPageInsights';
import useScrollEdgeFades from '../shared/useScrollEdgeFades';

const SELECTOR_MODES = [
  { id: 'optimized', label: 'Optimized' },
  { id: 'full', label: 'Full' }
];
const COPY_CONFIRMATION_MS = 2000;

const OverflowTitle = ({ as: Component, text, ...props }) => {
  const ref = useRef(null);
  const [truncated, setTruncated] = useState(false);

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) {
      setTruncated(false);
      return;
    }
    setTruncated(node.scrollWidth > node.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, text]);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <Component ref={ref} title={truncated ? text : undefined} {...props}>
      {text}
    </Component>
  );
};

OverflowTitle.propTypes = {
  as: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired
};

const SelectorOverflowText = ({ text }) => {
  const slotRef = useRef(null);
  const [truncated, setTruncated] = useState(false);
  const [tooltipWidth, setTooltipWidth] = useState(0);

  const measure = useCallback(() => {
    const node = slotRef.current?.firstElementChild;
    if (!node) {
      setTruncated(false);
      setTooltipWidth(0);
      return;
    }
    setTruncated(node.scrollWidth > node.clientWidth + 1);
    setTooltipWidth(Math.round(node.getBoundingClientRect().width));
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, text]);

  useEffect(() => {
    const node = slotRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <SelectorTextSlot ref={slotRef}>
      <Tooltip
        as={SelectorText}
        data-testid="behaviorlens-selector-text"
        open={truncated ? undefined : false}
        placement="top"
        tabIndex={truncated ? 0 : undefined}
        title={truncated ? text : undefined}
        tooltipStyle={{
          boxSizing: 'border-box',
          display: 'block',
          maxWidth: tooltipWidth > 0 ? `${tooltipWidth}px` : undefined,
          overflowWrap: 'anywhere',
          textAlign: 'left',
          whiteSpace: 'normal',
          width: tooltipWidth > 0 ? `${tooltipWidth}px` : undefined,
          wordBreak: 'break-word'
        }}
        usePortal
      >
        {text}
      </Tooltip>
    </SelectorTextSlot>
  );
};

SelectorOverflowText.propTypes = {
  text: PropTypes.string.isRequired
};

const writeClipboard = async text => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand?.('copy');
  document.body.removeChild(textarea);
  if (copied === false) {
    throw new Error('Clipboard unavailable');
  }
};

const InspectModeRail = ({
  clickCountsByNode,
  hoveredNodeId = null,
  onHoverTarget,
  onSelectTarget,
  onSelectorModeChange,
  selectedElement = null,
  selectorMode,
  targets
}) => {
  const [copyState, setCopyState] = useState('idle');
  const orderedTargets = useMemo(() => (
    targets
      .map(target => ({
        ...target,
        clickCount: clickCountsByNode.get(target.nodeId) || 0
      }))
      .sort((left, right) => (
        right.clickCount - left.clickCount || left.label.localeCompare(right.label)
      ))
  ), [clickCountsByNode, targets]);
  const scrollContentKey = orderedTargets.map(target => (
    `${target.nodeId}:${target.clickCount}`
  )).join('|');
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(scrollContentKey);
  const selector = selectorMode === 'full'
    ? selectedElement?.fullSelector
    : selectedElement?.optimizedSelector;
  const selectedClickCount = selectedElement
    ? clickCountsByNode.get(selectedElement.nodeId) || 0
    : 0;

  useEffect(() => {
    setCopyState('idle');
  }, [selectedElement, selectorMode]);

  useEffect(() => {
    if (copyState !== 'copied') return undefined;
    const timeout = window.setTimeout(() => setCopyState('idle'), COPY_CONFIRMATION_MS);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const copySelector = async () => {
    if (!selector) return;
    try {
      await writeClipboard(selector);
      setCopyState('copied');
    } catch (error) {
      setCopyState('idle');
    }
  };

  return (
    <>
      <InspectTargetsCard data-testid="behaviorlens-inspect-targets-card">
        <InsightsSectionLabel style={{ marginBottom: 8 }}>Most Interacted Elements</InsightsSectionLabel>
        {targets.length > 0 ? (
          <InsightsListViewport>
            <InspectTargetList ref={scrollRef} data-testid="behaviorlens-inspect-target-list" $captured>
              {orderedTargets.map(target => (
                <InspectTargetRow
                  key={target.nodeId}
                  type="button"
                  $active={target.nodeId === selectedElement?.nodeId
                    || target.nodeId === hoveredNodeId}
                  data-testid="behaviorlens-inspect-target-row"
                  onClick={() => onSelectTarget(target)}
                  onMouseDown={event => {
                    if (event.button !== 0) {
                      return;
                    }
                    event.preventDefault();
                    event.currentTarget.focus({ preventScroll: true });
                  }}
                  onMouseEnter={() => onHoverTarget(target.nodeId)}
                  onMouseLeave={() => onHoverTarget(null)}
                  onFocus={() => onHoverTarget(target.nodeId)}
                  onBlur={() => onHoverTarget(null)}
                >
                  <OverflowTitle
                    as={InspectTargetLabel}
                    $active={target.nodeId === selectedElement?.nodeId}
                    text={target.label}
                  />
                </InspectTargetRow>
              ))}
            </InspectTargetList>
            <InsightsListFade
              aria-hidden="true"
              $edge="top"
              $height={28}
              $opacity={fadeTop}
            />
            <InsightsListFade
              aria-hidden="true"
              $edge="bottom"
              $height={28}
              $opacity={fadeBottom}
            />
          </InsightsListViewport>
        ) : (
          <InsightsStateBody>
            This page view has no semantic element the recording can identify.
          </InsightsStateBody>
        )}
      </InspectTargetsCard>

      <InspectSelectorCard data-testid="behaviorlens-inspect-selector">
        <InspectCardTitle $selector>Element Selector</InspectCardTitle>
        <SelectorModeSwitch role="group" aria-label="Selector format">
          {SELECTOR_MODES.map(mode => (
            <SelectorModeButton
              key={mode.id}
              type="button"
              $active={selectorMode === mode.id}
              aria-pressed={selectorMode === mode.id}
              disabled={!selectedElement}
              onClick={() => onSelectorModeChange(mode.id)}
            >
              {`${mode.label} selector`}
            </SelectorModeButton>
          ))}
        </SelectorModeSwitch>
        {selectedElement ? (
          <SelectorBox data-testid="behaviorlens-selector-box">
            <SelectorOverflowText
              text={selector || 'This element has no selector in the recording.'}
            />
            <SelectorCopyButton
              type="button"
              variant="ghost"
              size="small"
              startIcon={copyState === 'copied' ? IconCheck : IconCopyFilled}
              srOnlyText={copyState === 'copied' ? 'Selector copied' : 'Copy selector'}
              disabled={!selector}
              aria-label={copyState === 'copied' ? 'Selector copied' : 'Copy selector'}
              onMouseDown={event => event.preventDefault()}
              onClick={copySelector}
              data-testid="behaviorlens-selector-copy"
            />
          </SelectorBox>
        ) : (
          <InsightsStateBody data-testid="behaviorlens-inspect-empty" style={{ marginTop: 12 }}>
            Select a captured element or click one on the page.
          </InsightsStateBody>
        )}
      </InspectSelectorCard>

      <InsightsCard data-testid="behaviorlens-inspect-detail" style={{ flex: 'none', marginBottom: 0 }}>
        <InspectCardTitle>Selected Element</InspectCardTitle>
        {selectedElement ? (
          <>
            <OverflowTitle as={SelectedElementName} text={selectedElement.label} />
            <InspectMetricCard>
              <InspectMetricValue>{selectedClickCount.toLocaleString('en-US')}</InspectMetricValue>
              <InspectMetricLabel>Total Clicks</InspectMetricLabel>
            </InspectMetricCard>
          </>
        ) : (
          <InsightsStateBody>Select an element to inspect its click total.</InsightsStateBody>
        )}
      </InsightsCard>
    </>
  );
};

InspectModeRail.propTypes = {
  clickCountsByNode: PropTypes.instanceOf(Map).isRequired,
  hoveredNodeId: PropTypes.number,
  onHoverTarget: PropTypes.func.isRequired,
  onSelectTarget: PropTypes.func.isRequired,
  onSelectorModeChange: PropTypes.func.isRequired,
  selectedElement: PropTypes.object,
  selectorMode: PropTypes.string.isRequired,
  targets: PropTypes.array.isRequired
};

export default InspectModeRail;
