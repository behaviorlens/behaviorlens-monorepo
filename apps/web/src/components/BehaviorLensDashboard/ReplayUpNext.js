import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { IconPlayFilled } from '../../ui/icons';
import {
  ReplayUpNextActions,
  ReplayUpNextButton,
  ReplayUpNextCard,
  ReplayUpNextKicker,
  ReplayUpNextMeta,
  ReplayUpNextOverlay,
  ReplayUpNextTitle
} from './ScBehaviorLensWorkspace';
import {
  formatSessionDuration,
  formatSessionEventCount,
  getSessionIdentity
} from './behaviorLensSessionRows';

const ReplayUpNext = ({
  countdown, onCancel, onPlayNow, session, sessionId
}) => {
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const title = String(session?.page_title || '').trim() || 'Next session';
  const identity = getSessionIdentity(session, sessionId);
  const duration = formatSessionDuration(session?.duration_s);
  const eventCount = formatSessionEventCount(session?.event_count);

  return (
    <ReplayUpNextOverlay
      role="dialog"
      aria-label="Up next"
      data-testid="behaviorlens-replay-up-next"
    >
      <ReplayUpNextCard>
        <ReplayUpNextKicker aria-live="polite">
          {`Up next in ${countdown} ${countdown === 1 ? 'second' : 'seconds'}`}
        </ReplayUpNextKicker>
        <ReplayUpNextTitle>{title}</ReplayUpNextTitle>
        <ReplayUpNextMeta>
          {`${identity} · ${duration} · ${eventCount}`}
        </ReplayUpNextMeta>
        <ReplayUpNextActions>
          <ReplayUpNextButton
            type="button"
            colorStyle="primary"
            variant="outline"
            size="small"
            onClick={onCancel}
          >
            Cancel
          </ReplayUpNextButton>
          <ReplayUpNextButton
            type="button"
            colorStyle="primary"
            variant="filled"
            size="small"
            startIcon={IconPlayFilled}
            onClick={onPlayNow}
          >
            Play next
          </ReplayUpNextButton>
        </ReplayUpNextActions>
      </ReplayUpNextCard>
    </ReplayUpNextOverlay>
  );
};

ReplayUpNext.propTypes = {
  countdown: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  onPlayNow: PropTypes.func.isRequired,
  session: PropTypes.object,
  sessionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

ReplayUpNext.defaultProps = {
  session: null
};

export default ReplayUpNext;
