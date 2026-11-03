import React, {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import { Checkbox, DropdownOption } from '../../ui';
import {
  IconArrowRotateLeft,
  IconCompress,
  IconExpand,
  IconPauseFilled,
  IconPlayFilled
} from '../../ui/icons';
import {
  ControlBar,
  ControlGroup,
  ControlIconButton,
  ControlLockedGroup,
  ControlPlayButton,
  ControlReplayGlyph,
  ControlSkipToggle,
  ControlSpacer,
  ControlSpeedSelect,
  ControlTime
} from '../workspace/ScBehaviorLensWorkspace';
import { buildInactivityGaps } from './behaviorLensInactivity';
import { writeSessionReplayPlaybackPreference } from '../shared/behaviorLensLayoutPreferences';
import { EMPTY_ARRAY } from '../../lib/propDefaults';

export const formatReplayClock = ms => {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const getEventPayload = event => (
  event?.payload ?? event?.detail?.payload ?? event?.detail
);

const REPLAY_END_TOLERANCE_MS = 250;

// Transport row under the replay timeline (reference: play/pause, skip, time,
// note, speed, skip-inactivity, fullscreen). This is presentation only: every
// action drives the existing rrweb-player instance through its public API, so
// playback semantics (heatmap pause, Space toggle, audio sync) are unchanged.
const ReplayControlBar = ({
  canFullscreen = true,
  getReplayCurrentTime = null,
  events = EMPTY_ARRAY,
  noteSlot = null,
  onClosePreview = null,
  onFullscreenChange = null,
  playbackLocked = false,
  isPlayingRef = null,
  playerInstanceRef,
  replayDurationMs,
  replayReady,
  replayRevision = 0,
  seekReplay,
  skipInactivePreferenceRef = null,
  speedOptions,
  stageRef = null,
  togglePlay,
  warming = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayFinished, setReplayFinished] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [speed, setSpeed] = useState(speedOptions[0] || 1);
  const [skipInactive, setSkipInactive] = useState(Boolean(skipInactivePreferenceRef?.current));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const skipInactiveRef = useRef(Boolean(skipInactivePreferenceRef?.current));
  const playbackLockedRef = useRef(playbackLocked);
  playbackLockedRef.current = playbackLocked;
  const lastSkippedGapRef = useRef(null);
  const lastSampleTimeRef = useRef(null);
  const stationarySampleCountRef = useRef(0);
  const inactivityGaps = useMemo(() => buildInactivityGaps(events), [events]);

  // Mirror player state/time. rrweb-player supports multiple listeners, so
  // this does not disturb the page-level 'ui-update-player-state' listener.
  useEffect(() => {
    if (!replayReady) {
      setReplayFinished(false);
      return undefined;
    }
    setIsPlaying(false);
    setReplayFinished(false);
    setCurrentTimeMs(0);
    setSpeed(speedOptions[0] || 1);
    const preferSkipInactive = Boolean(skipInactivePreferenceRef?.current);
    setSkipInactive(preferSkipInactive);
    skipInactiveRef.current = preferSkipInactive;
    lastSkippedGapRef.current = null;
    lastSampleTimeRef.current = null;
    stationarySampleCountRef.current = 0;
    const player = playerInstanceRef.current;
    if (!player) {
      return undefined;
    }
    const updateTime = value => {
      const time = Number(value);
      if (Number.isFinite(time)) {
        const nextTime = Math.max(0, time);
        setCurrentTimeMs(nextTime);
        if (nextTime < Math.max(0, replayDurationMs - REPLAY_END_TOLERANCE_MS)) {
          setReplayFinished(false);
        }
        if (skipInactiveRef.current && !playbackLockedRef.current) {
          const gap = inactivityGaps.find(item => time >= item.startMs && time < item.endMs - 40);
          if (gap && lastSkippedGapRef.current !== gap.id) {
            lastSkippedGapRef.current = gap.id;
            seekReplay(gap.endMs, true);
          }
        }
      }
    };
    const unsubscribeState = typeof player.addEventListener === 'function'
      ? player.addEventListener('ui-update-player-state', event => {
        setIsPlaying(getEventPayload(event) === 'playing');
      })
      : null;
    const unsubscribeTime = typeof player.addEventListener === 'function'
      ? player.addEventListener('ui-update-current-time', event => {
        updateTime(getEventPayload(event));
      })
      : null;
    const unsubscribeFinish = typeof player.addEventListener === 'function'
      ? player.addEventListener('finish', () => {
        setIsPlaying(false);
        setReplayFinished(true);
      })
      : null;
    const samplePlayer = () => {
      const sampledTime = Number(getReplayCurrentTime?.());
      if (!Number.isFinite(sampledTime)) {
        return;
      }
      updateTime(sampledTime);
      if (isPlayingRef) {
        setIsPlaying(Boolean(isPlayingRef.current));
        lastSampleTimeRef.current = sampledTime;
        return;
      }
      if (lastSampleTimeRef.current === null) {
        lastSampleTimeRef.current = sampledTime;
        return;
      }
      if (sampledTime > lastSampleTimeRef.current + 1) {
        stationarySampleCountRef.current = 0;
        setIsPlaying(true);
      } else {
        stationarySampleCountRef.current += 1;
        if (stationarySampleCountRef.current >= 2) {
          setIsPlaying(false);
        }
      }
      lastSampleTimeRef.current = sampledTime;
    };
    samplePlayer();
    const interval = window.setInterval(samplePlayer, 250);
    return () => {
      window.clearInterval(interval);
      if (typeof unsubscribeState === 'function') {
        unsubscribeState();
      }
      if (typeof unsubscribeTime === 'function') {
        unsubscribeTime();
      }
      if (typeof unsubscribeFinish === 'function') {
        unsubscribeFinish();
      }
    };
  }, [
    getReplayCurrentTime,
    inactivityGaps,
    isPlayingRef,
    playerInstanceRef,
    replayReady,
    replayDurationMs,
    replayRevision,
    seekReplay,
    skipInactivePreferenceRef,
    speedOptions
  ]);

  const handleSpeedChange = useCallback(nextValue => {
    if (playbackLockedRef.current) {
      return;
    }
    const nextSpeed = Number(nextValue);
    const player = playerInstanceRef.current;
    if (!Number.isFinite(nextSpeed) || !player || typeof player.setSpeed !== 'function') {
      return;
    }
    try {
      player.setSpeed(nextSpeed);
      setSpeed(nextSpeed);
    } catch (error) {
      // A disposed player cannot change speed.
    }
  }, [playerInstanceRef]);

  const handleSkipInactiveToggle = useCallback(() => {
    if (playbackLockedRef.current) {
      return;
    }
    const player = playerInstanceRef.current;
    if (!player || typeof player.toggleSkipInactive !== 'function') {
      return;
    }
    try {
      player.toggleSkipInactive();
      setSkipInactive(value => {
        const next = !value;
        skipInactiveRef.current = next;
        if (skipInactivePreferenceRef) {
          skipInactivePreferenceRef.current = next;
        }
        writeSessionReplayPlaybackPreference({ skipInactive: next });
        lastSkippedGapRef.current = null;
        return next;
      });
    } catch (error) {
      // A disposed player cannot toggle skip-inactive.
    }
  }, [playerInstanceRef, skipInactivePreferenceRef]);

  useEffect(() => {
    const handleChange = () => {
      const fullscreen = document.fullscreenElement === stageRef?.current;
      setIsFullscreen(fullscreen);
      onFullscreenChange?.(fullscreen);
    };
    document.addEventListener('fullscreenchange', handleChange);
    handleChange();
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [onFullscreenChange, stageRef]);

  const handleFullscreen = useCallback(() => {
    const workspaceNode = stageRef?.current;
    if (document.fullscreenElement === workspaceNode) {
      if (typeof document.exitFullscreen === 'function') {
        Promise.resolve(document.exitFullscreen()).catch(() => {});
      }
      return;
    }
    if (workspaceNode && typeof workspaceNode.requestFullscreen === 'function') {
      Promise.resolve(workspaceNode.requestFullscreen()).catch(() => {});
    }
  }, [stageRef]);

  const displayPlaying = playbackLocked ? false : isPlaying;
  const displayFinished = !playbackLocked && replayFinished;
  // Scroll Maps locks transport interactions, but the clock stays at the
  // position where playback was paused so the mode change does not look like
  // an unexpected seek back to the beginning.
  const displayTimeMs = currentTimeMs;
  const handleTogglePlay = useCallback(() => {
    if (replayFinished) {
      togglePlay();
      if (seekReplay(0, true)) {
        setCurrentTimeMs(0);
        setReplayFinished(false);
        setIsPlaying(true);
        if (isPlayingRef) {
          isPlayingRef.current = true;
        }
      }
      return;
    }
    togglePlay();
    if (isPlayingRef) {
      setIsPlaying(Boolean(isPlayingRef.current));
    }
  }, [isPlayingRef, replayFinished, seekReplay, togglePlay]);

  return (
    <ControlBar data-testid="behaviorlens-replay-control-bar">
      <ControlLockedGroup
        $locked={playbackLocked}
        data-locked={playbackLocked ? 'true' : undefined}
        data-testid="behaviorlens-control-locked-group"
      >
        <ControlGroup>
          <ControlPlayButton
            type="button"
            disabled={playbackLocked}
            onClick={playbackLocked ? undefined : handleTogglePlay}
            aria-label={displayPlaying
              ? 'Pause replay'
              : (displayFinished ? 'Replay session' : 'Play replay')}
            aria-busy={warming || undefined}
            title={playbackLocked
              ? 'Playback is paused on Scroll Maps'
              : (warming ? 'Buffering the replay — playback starts as soon as it is ready.' : undefined)}
            data-testid="behaviorlens-control-play"
          >
            {displayPlaying ? (
              <IconPauseFilled className="behaviorlens-transport-glyph" aria-hidden="true" />
            ) : displayFinished ? (
              <ControlReplayGlyph aria-hidden="true">
                <IconArrowRotateLeft />
                <IconPlayFilled />
              </ControlReplayGlyph>
            ) : (
              <IconPlayFilled className="behaviorlens-transport-glyph" aria-hidden="true" />
            )}
          </ControlPlayButton>
          <ControlTime data-testid="behaviorlens-control-time">
            {`${formatReplayClock(displayTimeMs)} / ${formatReplayClock(replayDurationMs)}`}
          </ControlTime>
          {noteSlot}
        </ControlGroup>
        <ControlSpacer />
        <ControlGroup>
          <ControlSpeedSelect
            value={speed}
            onChange={handleSpeedChange}
            disabled={playbackLocked}
            aria-label="Playback speed"
            title={playbackLocked ? 'Playback is paused on Scroll Maps' : undefined}
            data-testid="behaviorlens-control-speed"
            zIndex={30}
          >
            {speedOptions.map(option => (
              <DropdownOption key={option} value={option}>{`${option}x`}</DropdownOption>
            ))}
          </ControlSpeedSelect>
          <ControlSkipToggle $locked={playbackLocked}>
            <Checkbox
              size="small"
              label="Skip inactivity"
              checked={skipInactive}
              disabled={playbackLocked}
              onChange={handleSkipInactiveToggle}
              data-testid="behaviorlens-control-skip-inactivity"
            />
          </ControlSkipToggle>
        </ControlGroup>
      </ControlLockedGroup>
      {onClosePreview ? (
        <ControlIconButton
          type="button"
          onClick={onClosePreview}
          aria-label="Close replay preview"
          data-testid="behaviorlens-control-close-preview"
        >
          <IconCompress aria-hidden="true" />
        </ControlIconButton>
      ) : canFullscreen && (
        <ControlIconButton
          type="button"
          onClick={handleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen replay' : 'Fullscreen replay'}
          aria-pressed={isFullscreen}
          data-testid="behaviorlens-control-fullscreen"
        >
          {isFullscreen ? <IconCompress aria-hidden="true" /> : <IconExpand aria-hidden="true" />}
        </ControlIconButton>
      )}
    </ControlBar>
  );
};

ReplayControlBar.propTypes = {
  canFullscreen: PropTypes.bool,
  events: PropTypes.arrayOf(PropTypes.object),
  getReplayCurrentTime: PropTypes.func,
  isPlayingRef: PropTypes.shape({ current: PropTypes.bool }),
  noteSlot: PropTypes.node,
  onClosePreview: PropTypes.func,
  onFullscreenChange: PropTypes.func,
  playbackLocked: PropTypes.bool,
  playerInstanceRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  replayDurationMs: PropTypes.number.isRequired,
  replayReady: PropTypes.bool.isRequired,
  replayRevision: PropTypes.number,
  seekReplay: PropTypes.func.isRequired,
  skipInactivePreferenceRef: PropTypes.shape({ current: PropTypes.bool }),
  speedOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  stageRef: PropTypes.shape({ current: PropTypes.any }),
  togglePlay: PropTypes.func.isRequired,
  warming: PropTypes.bool
};

export default ReplayControlBar;
