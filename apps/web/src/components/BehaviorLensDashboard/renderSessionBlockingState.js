import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Loader } from '../../ui';
import {
  PageStateBody,
  PageStatePanel,
  PageStateTitle,
  PageStateWrap
} from './ScBehaviorLensWorkspace';

// Distinct page-level states: still loading, or the replay could not be
// opened. Kept out of the component body so the render path stays readable.
const renderBlockingState = ({ listReturnPath, loading, payload }) => {
  if (loading) {
    return (
      <PageStateWrap>
        <PageStatePanel role="status">
          <Loader />
          <PageStateBody>Loading session replay...</PageStateBody>
        </PageStatePanel>
      </PageStateWrap>
    );
  }

  // The backend merges archived and still-buffered events, so even an active
  // session is replayable; only a session with no events at all cannot play.
  if (payload && !payload.replayTooLarge
    && (!Array.isArray(payload.events) || payload.events.length === 0)) {
    return (
      <PageStateWrap>
        <PageStatePanel>
          <PageStateTitle>No replay events yet</PageStateTitle>
          <PageStateBody>
            This session has not produced any replayable events. Check back after the visitor interacts with the page.
          </PageStateBody>
        </PageStatePanel>
      </PageStateWrap>
    );
  }

  if (!payload || payload.replayTooLarge) {
    return (
      <PageStateWrap>
        <PageStatePanel>
          <PageStateTitle>
            {payload?.replayTooLarge
              ? 'This replay is too large to load'
              : 'Session could not be loaded'}
          </PageStateTitle>
          <PageStateBody>
            {payload?.replayTooLarge
              ? 'The recording exceeds the size the player can open in the browser.'
              : 'The session may have been removed, or the request failed. Return to the list and try again.'}
          </PageStateBody>
          <Button
            as={Link}
            to={listReturnPath}
            colorStyle="secondary"
            variant="outline"
            size="medium"
          >
            Back to Sessions
          </Button>
        </PageStatePanel>
      </PageStateWrap>
    );
  }

  return null;
};

export default renderBlockingState;
