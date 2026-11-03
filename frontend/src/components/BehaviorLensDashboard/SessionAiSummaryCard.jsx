import React, {
  Fragment, useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import { Button, Loader } from '../../ui';
import { IconPlayFilled, IconWandMagicFilled } from '../../ui/icons';
import aiSummaryEmptyIllustration from '../../assets/behaviorlens-ai-summary-empty.png';
import {
  AiSummaryBottomFade,
  AiSummaryCard,
  AiSummaryCardContent,
  AiSummaryCards,
  AiSummaryCitation,
  AiSummaryConfidenceLabel,
  AiSummaryConfidencePill,
  AiSummaryConfidenceRow,
  AiSummaryHeaderActions,
  AiSummaryCopy,
  AiSummaryBlock,
  AiSummaryDetectedBody,
  AiSummaryError,
  AiSummaryEmptyContent,
  AiSummaryEmptyCopy,
  AiSummaryEmptyDescription,
  AiSummaryEmptyIllustration,
  AiSummaryEmptyIllustrationFrame,
  AiSummaryEmptyState,
  AiSummaryEmptyTitle,
  AiSummaryGenerateButton,
  AiSummaryHeader,
  AiSummaryHeadline,
  AiSummaryInsightBody,
  AiSummaryInterpretation,
  AiSummaryIssueContent,
  AiSummaryMoment,
  AiSummaryMomentCopy,
  AiSummaryMomentTitle,
  AiSummaryObservation,
  AiSummaryPanelContent,
  AiSummaryPanelScroll,
  AiSummarySectionTitle,
  AiSummarySeekChip,
  AiSummarySeekMore,
  AiSummarySeekRow,
  AiSummarySignal,
  AiSummarySignalRow,
  AiSummaryStack,
  AiSummaryStatus,
  AiSummaryTakeaways,
  AiSummaryTopFade
} from './ScBehaviorLensAiSummary';
import { resolveCitationParts } from './behaviorLensAiSummaryCitations';
import { formatReplayTimestamp } from './behaviorLensNoteTimestamps';
import useScrollEdgeFades from './useScrollEdgeFades';
import { EMPTY_OBJECT } from '../../lib/propDefaults';

export const collectSeekOffsets = (item, evidenceAnchors) => {
  const seen = new Set();
  const offsets = [];
  (item?.evidenceIds || []).forEach(id => {
    const atMs = evidenceAnchors?.[id]?.atMs;
    if (!Number.isFinite(atMs) || seen.has(atMs)) {
      return;
    }
    seen.add(atMs);
    offsets.push(atMs);
  });
  offsets.sort((left, right) => left - right);
  return offsets;
};

export const getKeyMomentSeekOffset = (moment, evidenceAnchors) => {
  const offsets = collectSeekOffsets(moment, evidenceAnchors);
  return offsets.length > 0 ? offsets[0] : null;
};

const VISIBLE_SEEK_CHIPS = 3;

const SeekClocks = ({ offsets, onSeek }) => {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = offsets.length - VISIBLE_SEEK_CHIPS;
  const visibleOffsets = expanded || hiddenCount <= 0
    ? offsets
    : offsets.slice(0, VISIBLE_SEEK_CHIPS);

  return (
    <AiSummarySeekRow>
      {visibleOffsets.map(offset => {
        const clock = formatReplayTimestamp(offset);
        return (
          <AiSummarySeekChip
            key={offset}
            type="button"
            aria-label={`Jump replay to ${clock}`}
            onClick={() => onSeek(offset)}
          >
            <IconPlayFilled aria-hidden="true" />
            {clock}
          </AiSummarySeekChip>
        );
      })}
      {!expanded && hiddenCount > 0 && (
        <AiSummarySeekMore type="button" onClick={() => setExpanded(true)}>
          {`+${hiddenCount} more`}
        </AiSummarySeekMore>
      )}
    </AiSummarySeekRow>
  );
};

SeekClocks.propTypes = {
  offsets: PropTypes.arrayOf(PropTypes.number).isRequired,
  onSeek: PropTypes.func.isRequired
};

// Intern types every confidence as the enum low | medium | high, so the Figma
// pill and its bar are driven by the level and never by an invented percent.
const CONFIDENCE_PERCENT = { low: 33, medium: 67, high: 100 };

const MAX_SIGNALS = 3;

const mergeCitationLookup = (evidenceCitations, evidenceAnchors) => {
  const lookup = { ...evidenceCitations };
  Object.entries(evidenceAnchors || {}).forEach(([id, anchor]) => {
    if (!lookup[id] || !Number.isFinite(anchor?.atMs)) return;
    lookup[id] = { ...lookup[id], atMs: anchor.atMs };
  });
  return lookup;
};

const citedChildren = (text, lookup, onSeek) => {
  const parts = resolveCitationParts(text, lookup);
  const nodes = [];
  let lastChar = '';
  parts.forEach((part, index) => {
    if (part.type === 'text') {
      nodes.push(part.value);
      lastChar = part.value.slice(-1);
      return;
    }
    part.citations.forEach((citation, citationIndex) => {
      if (citationIndex > 0) {
        nodes.push(', ');
        lastChar = ' ';
      } else if (lastChar && !/[\s(]/u.test(lastChar)) {
        nodes.push(' ');
      }
      const canSeek = Number.isFinite(citation.atMs) && typeof onSeek === 'function';
      nodes.push(
        canSeek ? (
          <AiSummaryCitation
            key={`${citation.id}-${index}-${citationIndex}`}
            type="button"
            onClick={() => onSeek(citation.atMs)}
          >
            {citation.label}
          </AiSummaryCitation>
        ) : (
          <Fragment key={`${citation.id}-${index}-${citationIndex}`}>
            {citation.label}
          </Fragment>
        )
      );
      lastChar = 'x';
    });
  });
  return nodes;
};

const CitedText = ({
  Component, lookup, onSeek = null, text = ''
}) => {
  if (!text) return null;
  const children = citedChildren(text, lookup, onSeek);
  if (children.length === 0) return null;
  return <Component>{children}</Component>;
};

CitedText.propTypes = {
  Component: PropTypes.elementType.isRequired,
  lookup: PropTypes.object.isRequired,
  onSeek: PropTypes.func,
  text: PropTypes.string
};
const SummarySectionCard = ({
  children = null,
  title,
  titleTestId
}) => {
  return (
    <AiSummaryCard aria-label={title}>
      <AiSummaryCardContent>
        <AiSummaryBlock>
          <AiSummarySectionTitle data-testid={titleTestId}>{title}</AiSummarySectionTitle>
          {children}
        </AiSummaryBlock>
      </AiSummaryCardContent>
    </AiSummaryCard>
  );
};

SummarySectionCard.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string.isRequired,
  titleTestId: PropTypes.string
};
const SessionAiSummaryCard = ({
  error = null,
  evidenceCitations = EMPTY_OBJECT,
  generate,
  generating,
  loading,
  onSeek,
  regenerate,
  regenerating,
  summary = null
}) => {
  const result = summary?.result;
  const busy = generating || regenerating;
  const lookup = mergeCitationLookup(evidenceCitations, summary?.evidenceAnchors);
  const takeaways = [
    result?.frictionAssessment?.summary,
    result?.likelyIntent?.text,
    result?.ending?.text
  ].filter(Boolean);
  const intentConfidence = result?.likelyIntent?.confidence;
  const confidenceLevel = CONFIDENCE_PERCENT[intentConfidence] ? intentConfidence : null;
  const detectedMoments = Array.isArray(result?.keyMoments) ? result.keyMoments : [];
  const observations = Array.isArray(result?.behavioralObservations)
    ? result.behavioralObservations
    : [];
  const seekableMoments = detectedMoments
    .map(moment => ({
      moment,
      offsets: collectSeekOffsets(moment, summary?.evidenceAnchors)
    }))
    .filter(item => item.offsets.length > 0);
  const seekableObservations = observations
    .map(observation => ({
      observation,
      offsets: collectSeekOffsets(observation, summary?.evidenceAnchors)
    }))
    .filter(item => item.offsets.length > 0);
  const detectedIssueCount = seekableMoments.length + seekableObservations.length;
  const signals = observations.slice(0, MAX_SIGNALS);
  const headerRef = useRef(null);
  const [headerStacked, setHeaderStacked] = useState(false);
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(result);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!result || !header || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const updateStacked = () => {
      const children = Array.from(header.children);
      if (children.length < 2) {
        setHeaderStacked(false);
        return;
      }
      const gap = Number.parseFloat(getComputedStyle(header).gap) || 8;
      const needed = children.reduce((sum, child) => sum + child.offsetWidth, 0)
        + (gap * (children.length - 1));
      setHeaderStacked(needed > header.clientWidth);
    };

    updateStacked();
    const observer = new ResizeObserver(updateStacked);
    observer.observe(header);
    return () => observer.disconnect();
  }, [confidenceLevel, result]);

  if (!result) {
    if (!loading && !generating) {
      return (
        <AiSummaryEmptyState aria-label="AI Summary">
          <AiSummaryEmptyContent>
            <AiSummaryEmptyIllustrationFrame>
              <AiSummaryEmptyIllustration
                alt=""
                aria-hidden="true"
                src={aiSummaryEmptyIllustration}
              />
            </AiSummaryEmptyIllustrationFrame>
            <AiSummaryEmptyCopy>
              <AiSummaryEmptyTitle>No AI Summary Yet</AiSummaryEmptyTitle>
              <AiSummaryEmptyDescription>
                Generate an AI-powered summary to instantly understand what happened during this
                session.
              </AiSummaryEmptyDescription>
            </AiSummaryEmptyCopy>
          </AiSummaryEmptyContent>
          <AiSummaryGenerateButton
            type="button"
            size="small"
            colorStyle="primary"
            variant="filled"
            startIcon={IconWandMagicFilled}
            disabled={busy}
            onClick={generate}
          >
            Generate AI Summary
          </AiSummaryGenerateButton>
          {error && <AiSummaryError role="alert">{error}</AiSummaryError>}
        </AiSummaryEmptyState>
      );
    }

    return (
      <AiSummaryCard aria-label="AI Summary" $compact>
        {loading && (
          <AiSummaryStatus role="status">
            <Loader size="small" />
            Loading summary...
          </AiSummaryStatus>
        )}
        {!loading && generating && (
          <AiSummaryStatus role="status">
            <Loader size="small" />
            Analyzing session...
          </AiSummaryStatus>
        )}
        {error && <AiSummaryError role="alert">{error}</AiSummaryError>}
      </AiSummaryCard>
    );
  }

  return (
    <AiSummaryStack aria-label="AI Summary" role="region">
      <AiSummaryPanelScroll ref={scrollRef} data-testid="behaviorlens-ai-summary-scroll">
        <AiSummaryPanelContent>
          <AiSummaryHeader ref={headerRef} $stacked={headerStacked}>
            {confidenceLevel && (
              <AiSummaryConfidenceRow $stacked={headerStacked}>
                <AiSummaryConfidenceLabel>AI Confidence</AiSummaryConfidenceLabel>
                <AiSummaryConfidencePill
                  $level={confidenceLevel}
                  data-testid="behaviorlens-ai-confidence"
                >
                  {confidenceLevel}
                </AiSummaryConfidencePill>
              </AiSummaryConfidenceRow>
            )}
            <AiSummaryHeaderActions $stacked={headerStacked}>
              <Button
                type="button" size="small" colorStyle="secondary"
                variant="ghost"
                loader={regenerating}
                loaderText="Regenerating"
                disabled={generating} onClick={regenerate}
              >
                Regenerate
              </Button>
            </AiSummaryHeaderActions>
          </AiSummaryHeader>
          {error && <AiSummaryError role="alert">{error}</AiSummaryError>}
          <AiSummaryCards>
            <SummarySectionCard title="Key Takeaways">
              {takeaways.length > 0 && (
                <AiSummaryTakeaways>
                  {takeaways.map(text => (
                    <CitedText
                      key={text}
                      Component={AiSummaryCopy}
                      lookup={lookup}
                      onSeek={onSeek}
                      text={text}
                    />
                  ))}
                </AiSummaryTakeaways>
              )}
            </SummarySectionCard>
            <SummarySectionCard title="Key Insight">
              {(result.headline || result.story || signals.length > 0) && (
                <>
                  <AiSummaryInsightBody>
                    <CitedText
                      Component={AiSummaryHeadline}
                      lookup={lookup}
                      onSeek={onSeek}
                      text={result.headline}
                    />
                    <CitedText
                      Component={AiSummaryCopy}
                      lookup={lookup}
                      onSeek={onSeek}
                      text={result.story}
                    />
                  </AiSummaryInsightBody>
                  {signals.length > 0 && (
                    <AiSummarySignalRow data-testid="behaviorlens-ai-signals">
                      {signals.map((item, index) => (
                        <AiSummarySignal key={item.title} $index={index}>
                          {item.title}
                        </AiSummarySignal>
                      ))}
                    </AiSummarySignalRow>
                  )}
                </>
              )}
            </SummarySectionCard>
            <SummarySectionCard
              title={`UX Issues · ${detectedIssueCount}`}
              titleTestId="behaviorlens-ai-detected-count"
            >
              {detectedIssueCount > 0 && (
                <AiSummaryDetectedBody>
                  {seekableMoments.map(({ moment, offsets }, index) => (
                    <AiSummaryMoment key={`${moment.title}-${index}`} $first={index === 0}>
                      <CitedText
                        Component={AiSummaryMomentTitle}
                        lookup={lookup}
                        onSeek={onSeek}
                        text={moment.title}
                      />
                      <AiSummaryIssueContent>
                        <CitedText
                          Component={AiSummaryMomentCopy}
                          lookup={lookup}
                          onSeek={onSeek}
                          text={moment.description}
                        />
                        <SeekClocks offsets={offsets} onSeek={onSeek} />
                      </AiSummaryIssueContent>
                    </AiSummaryMoment>
                  ))}
                  {seekableObservations.map(({ observation, offsets }, index) => (
                    <AiSummaryObservation
                      key={`${observation.title}-${index}`}
                      $first={seekableMoments.length === 0 && index === 0}
                    >
                      <CitedText
                        Component={AiSummaryMomentTitle}
                        lookup={lookup}
                        onSeek={onSeek}
                        text={observation.title}
                      />
                      <AiSummaryIssueContent>
                        <CitedText
                          Component={AiSummaryMomentCopy}
                          lookup={lookup}
                          onSeek={onSeek}
                          text={observation.observation}
                        />
                        {observation.interpretation && (
                          <CitedText
                            Component={AiSummaryInterpretation}
                            lookup={lookup}
                            onSeek={onSeek}
                            text={`Interpretation: ${observation.interpretation}`}
                          />
                        )}
                        <SeekClocks offsets={offsets} onSeek={onSeek} />
                      </AiSummaryIssueContent>
                    </AiSummaryObservation>
                  ))}
                </AiSummaryDetectedBody>
              )}
            </SummarySectionCard>
          </AiSummaryCards>
        </AiSummaryPanelContent>
      </AiSummaryPanelScroll>
      <AiSummaryTopFade aria-hidden="true" $opacity={fadeTop} />
      <AiSummaryBottomFade
        aria-hidden="true"
        data-testid="behaviorlens-ai-summary-fade"
        $opacity={fadeBottom}
      />
    </AiSummaryStack>
  );
};

SessionAiSummaryCard.propTypes = {
  error: PropTypes.string,
  evidenceCitations: PropTypes.object,
  generate: PropTypes.func.isRequired,
  generating: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  onSeek: PropTypes.func.isRequired,
  regenerate: PropTypes.func.isRequired,
  regenerating: PropTypes.bool.isRequired,
  summary: PropTypes.object
};
export default SessionAiSummaryCard;
