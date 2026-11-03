import styled from 'styled-components';

export const TimelineShell = styled.section`
  flex: 0 0 auto;
  background: transparent;
`;

export const TimelineHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 46px;
  padding: 0 18px;
`;

export const TimelineTitle = styled.h3`
  margin: 0;
  color: #24231f;
  font-size: 15px;
  font-weight: 750;
`;

export const TimelineDescription = styled.p`
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #76736d;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TimelineToggle = styled.button`
  border: 0;
  border-radius: 7px;
  padding: 6px 9px;
  background: transparent;
  color: #315f9b;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;

  &:hover { background: #eef4fc; }
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 1px; }
`;

export const TimelineBody = styled.div`
  padding: 5px 20px 18px;
`;

export const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  overflow-x: auto;
  padding: 2px 0 10px;
`;

export const CategoryChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  border: 1px solid ${({ $active }) => ($active ? '#c9c7c2' : '#e0ded9')};
  border-radius: 999px;
  padding: 5px 10px;
  background: ${({ $active }) => ($active ? '#ffffff' : '#f3f1ed')};
  color: ${({ $active }) => ($active ? '#2d2b28' : '#98948d')};
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 700;

  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 1px; }
`;

export const CategoryMark = styled.span`
  width: 8px;
  height: 8px;
  border-radius: ${({ $shape }) => ($shape === 'square' ? '1px' : '50%')};
  background: ${({ $color }) => $color};
  transform: ${({ $shape }) => ($shape === 'diamond' ? 'rotate(45deg)' : 'none')};
`;

export const CategoryCount = styled.span`
  color: #88847d;
  font-weight: 500;
`;

export const ResetButton = styled.button`
  flex: 0 0 auto;
  margin-left: auto;
  border: 0;
  padding: 5px 2px;
  background: transparent;
  color: #6f6b65;
  cursor: pointer;
  font: inherit;
  font-size: 11px;

  &:disabled { opacity: 0.45; cursor: default; }
`;

export const TimelineCanvas = styled.div`
  position: relative;
  height: 238px;
  border: 1px solid #dedcd7;
  border-radius: 11px;
  background: #ffffff;
  overflow: hidden;
`;

export const TrackButton = styled.button`
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  padding: 0;
  background: #efeeeb;
  cursor: pointer;
`;

export const PlayedTrack = styled.span`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $percent }) => `${$percent}%`};
  border-radius: inherit;
  background: #dbe6f2;
`;

export const RoutineTick = styled.button`
  position: absolute;
  left: ${({ $percent }) => `${$percent}%`};
  bottom: 43px;
  z-index: 2;
  width: 3px;
  height: 15px;
  border: 0;
  border-radius: 2px;
  padding: 0;
  background: ${({ $color }) => $color};
  transform: translateX(-50%);
  cursor: pointer;

  &:hover, &:focus-visible { width: 6px; outline: none; }
`;

export const SignalButton = styled.button`
  position: absolute;
  left: ${({ $percent }) => `${$percent}%`};
  top: ${({ $lane }) => `${20 + ($lane * 55)}px`};
  display: flex;
  align-items: center;
  gap: 7px;
  max-width: 190px;
  transform: translateX(-50%);
  border: 1px solid #d7d4cf;
  border-radius: 7px;
  padding: 6px 9px;
  background: #ffffff;
  color: #2b2926;
  box-shadow: 0 1px 2px rgba(25, 24, 21, 0.1);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 2px;
    height: ${({ $lane }) => `${150 - ($lane * 55)}px`};
    background: ${({ $color }) => $color};
    opacity: 0.72;
  }

  &:focus-visible { z-index: 3; outline: 2px solid #1463ff; outline-offset: 1px; }
`;

export const SignalLabel = styled.span`
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SignalTime = styled.span`
  color: #8a8781;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 500;
`;

export const ClusterButton = styled.button`
  position: absolute;
  left: ${({ $percent }) => `${$percent}%`};
  bottom: 72px;
  z-index: 2;
  transform: translateX(-50%);
  border: 1px solid #dad7d2;
  border-radius: 999px;
  padding: 4px 9px;
  background: #f7f6f3;
  color: #68645e;
  cursor: pointer;
  font: inherit;
  font-size: 10px;
  white-space: nowrap;
`;

export const ClusterDetails = styled.div`
  position: absolute;
  left: ${({ $percent }) => `${$percent}%`};
  bottom: 103px;
  z-index: 4;
  display: flex;
  gap: 4px;
  max-width: 280px;
  transform: translateX(-50%);
  border: 1px solid #d8d5cf;
  border-radius: 8px;
  padding: 5px;
  overflow-x: auto;
  background: #ffffff;
  box-shadow: 0 5px 18px rgba(20, 20, 18, 0.14);
`;

export const ClusterItem = styled.button`
  border: 0;
  border-radius: 5px;
  padding: 4px 6px;
  background: #f4f3f0;
  color: #55514b;
  cursor: pointer;
  font: inherit;
  font-size: 9px;
  white-space: nowrap;
`;

export const Playhead = styled.span`
  position: absolute;
  left: ${({ $percent }) => `${$percent}%`};
  bottom: 27px;
  z-index: 3;
  width: 4px;
  height: 50px;
  border-radius: 3px;
  background: #0e70c6;
  transform: translateX(-50%);
  pointer-events: none;
`;

export const ClockLabel = styled.span`
  position: absolute;
  bottom: 11px;
  color: #817d76;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
`;

export const EmptyTimeline = styled.div`
  padding: 16px;
  color: #7b7770;
  font-size: 12px;
`;

export const CompactTimeline = styled.div`
  position: relative;
  box-sizing: border-box;
  height: 80px;
  margin: 0 20px;
  background: transparent;

  @media (max-width: 720px) {
    margin: 0 10px;
  }
`;

export const TimelineActivityCard = styled.section`
  position: absolute;
  inset: 0 0 auto;
  box-sizing: border-box;
  width: 100%;
  height: 58px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
`;

export const TimelineActivityChart = styled.div`
  width: 100%;
  min-width: 0;
  height: 58px;
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'default')};
  opacity: ${({ $locked }) => ($locked ? 0.45 : 1)};
  transition: none;

  > div,
  .highcharts-container,
  .highcharts-root {
    max-width: 100%;
    overflow: visible !important;
  }
`;

export const NotesStrip = styled.div`
  position: absolute;
  z-index: 4;
  top: 42px;
  left: 0;
  width: 100%;
  height: 16px;
  pointer-events: none;
`;

export const NotesStripIcon = styled.button`
  position: absolute;
  top: 0;
  left: ${({ $percent }) => `${$percent}%`};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  margin: 0;
  padding: 0;
  border: 4px solid currentColor;
  border-radius: 50%;
  background: #ffffff;
  color: #0a1551;
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
  opacity: ${({ $locked }) => ($locked ? 0.45 : 1)};
  pointer-events: ${({ $locked }) => ($locked ? 'none' : 'auto')};
  transform: translateX(-50%);
  transition: none;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    color: #0a1551;
  }

  &:disabled {
    cursor: not-allowed;
    color: #0a1551;
  }

  &:focus-visible {
    outline: 2px solid #0a1551;
    outline-offset: 1px;
  }
`;

export const CompactTrack = styled.div`
  position: absolute;
  z-index: 2;
  top: 47px;
  left: 0;
  width: 100%;
  height: 5px;
  margin: 0;
  border: 0;
  border-radius: 2px;
  padding: 0;
  overflow: visible;
  background: #e0e2ea;
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
  opacity: ${({ $locked }) => ($locked ? 0.45 : 1)};
  transition: none;
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 4px; }
`;

export const CompactPlayed = styled.span`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $percent }) => `${$percent}%`};
  border-radius: inherit;
  background: #4276ff;
  pointer-events: none;
`;

export const CompactInactive = styled.span`
  position: absolute;
  z-index: 1;
  top: 0;
  bottom: 0;
  left: ${({ $startPercent }) => `${$startPercent}%`};
  width: ${({ $startPercent, $endPercent }) => (
    `${Math.max(0, $endPercent - $startPercent)}%`
  )};
  border-radius: 2px;
  background: #ff7b1c;
  pointer-events: none;
`;

export const CompactFlag = styled.button`
  position: absolute;
  z-index: 2;
  left: ${({ $percent }) => `${$percent}%`};
  bottom: 13px;
  width: 16px;
  height: 25px;
  border: 0;
  border-radius: 3px 3px 2px 2px;
  padding: 0;
  background: ${({ $color }) => $color};
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 9px;
  font-weight: 800;
  line-height: 15px;
  transform: translateX(-50%);
  clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 2px; }
`;

export const CompactPlayhead = styled.span`
  position: absolute;
  z-index: 3;
  left: ${({ $percent }) => `${$percent}%`};
  top: 50%;
  box-sizing: border-box;
  width: 15px;
  height: 15px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #4276ff;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

export const TimelineClockRow = styled.div`
  position: absolute;
  top: 61px;
  left: 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  pointer-events: none;
`;

export const TimelineClock = styled.span`
  color: #6f76a7;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const FlagPopover = styled.div`
  position: absolute;
  z-index: 8;
  left: ${({ $percent }) => `${$percent}%`};
  bottom: 38px;
  width: min(260px, calc(100vw - 56px));
  max-height: 170px;
  padding: 7px;
  overflow-y: auto;
  border: 1px solid #d9d7df;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(30, 27, 41, 0.16);
  transform: translateX(-50%);
`;

export const FlagPopoverRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  border-radius: 6px;
  padding: 9px 10px;
  background: transparent;
  color: #302d39;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-align: left;
  &:hover { background: #f5f3f8; }
  span:first-child { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  time { color: #817c8c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
`;

export const FlagPopoverDot = styled.span`
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;
