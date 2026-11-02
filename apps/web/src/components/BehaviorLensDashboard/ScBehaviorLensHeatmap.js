import styled from 'styled-components';
import { HEATMAP_LEGEND_GRADIENT } from './behaviorLensHeatmap';

export const HeatmapOverlay = styled.div`
  position: absolute;
  left: ${({ $fill, $left }) => ($fill ? '0' : `${$left}px`)};
  top: ${({ $fill, $top }) => ($fill ? '0' : `${$top}px`)};
  width: ${({ $fill, $width }) => ($fill ? '100%' : `${$width}px`)};
  height: ${({ $fill, $height }) => ($fill ? '100%' : `${$height}px`)};
  z-index: 5;
  overflow: hidden;
  pointer-events: none;
`;

export const HeatmapCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
`;

export const HeatmapLegend = styled.div`
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 7;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 24px);
  padding: 6px 8px;
  border-radius: 6px;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.24);
  font-size: 10px;
  line-height: 1.2;
  pointer-events: auto;
`;

export const HeatmapLegendScaleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const HeatmapLegendLabel = styled.span`
  min-width: 0;
  white-space: nowrap;
`;

export const HeatmapLegendScale = styled.span`
  width: 132px;
  min-width: 72px;
  height: 8px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  background: ${HEATMAP_LEGEND_GRADIENT};
`;

export const HeatmapOpacityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.32);
  white-space: nowrap;
`;

export const HeatmapOpacityLabel = styled.label`
  font-weight: 600;
`;

export const HeatmapOpacityInput = styled.input`
  width: 84px;
  height: 14px;
  margin: 0;
  accent-color: #f97316;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
`;

export const HeatmapStatus = styled.div`
  position: absolute;
  inset: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: #334155;
  background: rgba(255, 255, 255, 0.86);
  pointer-events: auto;
`;

export const HeatmapActiveClick = styled.div`
  position: absolute;
  left: ${({ $left }) => `${$left}px`};
  top: ${({ $top }) => `${$top}px`};
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #ef4444, 0 0 0 8px rgba(239, 68, 68, 0.28);
  pointer-events: none;
  z-index: 6;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    transform: translate(-50%, -50%);
  }
`;
