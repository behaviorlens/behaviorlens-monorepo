import { useMemo } from 'react';
import { buildClickListRows } from './behaviorLensClickList';

// The click readings the rail shows, derived from the one click parser.
export const usePageInsightsClickData = ({
  analysis, events, filter, firstTimestamp, nodeIndex, pageView, recordedViewport
}) => {
  const clickList = useMemo(() => buildClickListRows({
    analysis, events, filter, firstTimestamp, nodeIndex, pageView, recordedViewport
  }), [analysis, events, filter, firstTimestamp, nodeIndex, pageView, recordedViewport]);

  return { clickList };
};

export default usePageInsightsClickData;
