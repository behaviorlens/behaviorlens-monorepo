import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import SessionAiSummaryCard from './SessionAiSummaryCard';
import { buildEvidenceCitationLookup } from './behaviorLensAiSummaryCitations';
import { buildSemanticTimeline } from './behaviorLensSemanticEvents';
import useSessionAiSummary from './useSessionAiSummary';

const SessionAiSummaryFeature = ({ payload, seekReplay, sessionId }) => {
  const aiSummary = useSessionAiSummary({ payload, sessionId });
  const evidenceCitations = useMemo(
    () => buildEvidenceCitationLookup(buildSemanticTimeline(payload?.events)),
    [payload]
  );
  return (
    <SessionAiSummaryCard
      {...aiSummary}
      evidenceCitations={evidenceCitations}
      onSeek={offsetMs => seekReplay(offsetMs, false)}
    />
  );
};

SessionAiSummaryFeature.propTypes = {
  payload: PropTypes.object,
  seekReplay: PropTypes.func.isRequired,
  sessionId: PropTypes.string.isRequired
};
SessionAiSummaryFeature.defaultProps = { payload: null };

export default SessionAiSummaryFeature;
