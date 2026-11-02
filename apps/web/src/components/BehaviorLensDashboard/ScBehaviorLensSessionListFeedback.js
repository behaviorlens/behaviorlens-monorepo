import styled, { css } from 'styled-components';

const focusRing = css`
  outline: 2px solid #4276ff;
  outline-offset: 2px;
`;

export const ListHint = styled.p.attrs({
  'data-session-list-hint': ''
})`
  position: absolute;
  right: 0;
  bottom: 8px;
  left: 0;
  z-index: 1;
  margin: 0;
  color: #6f76a7;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  pointer-events: none;
`;

export const EmptyState = styled.div`
  flex: 0 0 auto;
  padding: 32px 8px;
  color: #6f76a7;
  font-size: 14px;
  text-align: center;

  @media (max-width: 720px) {
    padding: 20px 4px;
    font-size: 13px;
  }
`;

export const RetryButton = styled.button`
  margin-left: 8px;
  padding: 0;
  border: 0;
  color: #4276ff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
  text-decoration: underline;

  &:focus-visible {
    ${focusRing}
  }
`;

export const SkeletonBlock = styled.div`
  height: ${({ $height = 14 }) => `${$height}px`};
  width: ${({ $width = '70%' }) => (typeof $width === 'number' ? `${$width}px` : $width)};
  border-radius: 5px;
  background: linear-gradient(90deg, #eef0f3 25%, #f6f7f9 37%, #eef0f3 63%);
  background-size: 400% 100%;
  animation: behaviorlens-skeleton-pulse 1.4s ease infinite;

  @keyframes behaviorlens-skeleton-pulse {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
`;

// Shared collapse chevron, also used by the session detail insight cards.
export const ColumnCollapseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  transition: color 120ms ease, background-color 120ms ease, transform 120ms ease;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '0deg' : '180deg')});

  &:hover {
    color: #1463ff;
    background: #eaf2ff;
  }

  &:focus-visible {
    outline: 2px solid #1463ff;
    outline-offset: 1px;
  }
`;

export const FilterItem = styled.div`
  min-width: 0;
`;
