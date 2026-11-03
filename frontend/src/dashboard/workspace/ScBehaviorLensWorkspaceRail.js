import styled from 'styled-components';

export const WorkspaceRail = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: 1180px) {
    overflow: visible;
  }
`;

export const RailHeaderCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 0;
`;

export const RailHeaderIdentity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  height: 88px;
`;

export const RailHeaderTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 23px;
  min-width: 0;
`;

// "Show More" disclosure from the reference session card: underlined text
// button revealing the full session details inline.
export const RailHeaderDisclosure = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  height: 16px;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: #4276ff;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;

  svg {
    width: 14px;
    height: 14px;
    transform: ${({ 'aria-expanded': expanded }) => (expanded ? 'rotate(180deg)' : 'none')};
  }

  &:hover {
    color: #2e60df;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const RailHeaderDetails = styled.dl`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 216px;
  margin: 0;
  border: 1px solid #d9e8ff;
  border-radius: 12px;
  padding: 16px 20px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04);
`;

export const RailHeaderDetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 18px;
`;

export const RailHeaderDetailLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
  color: #6f76a7;
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;

  svg {
    width: ${({ $iconSize }) => `${$iconSize}px`};
    height: ${({ $iconSize }) => `${$iconSize}px`};
    flex: 0 0 auto;
  }
`;

export const RailHeaderDetailValue = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  max-width: 72%;
  overflow: hidden;
  color: #0a1551;
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RailHeaderDetailLink = styled.a`
  flex: 0 1 auto;
  min-width: 0;
  max-width: 72%;
  overflow: hidden;
  color: #4276ff;
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

export const RailHeaderStatus = styled.span`
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: ${({ $complete }) => ($complete ? '#e8f9ef' : '#eef4ff')};
  color: ${({ $complete }) => ($complete ? '#21b266' : '#4276ff')};
  font-size: 12px;
  font-weight: 700;
  line-height: 15px;
  white-space: nowrap;
`;

export const RailHeaderDetailDivider = styled.div`
  flex: 0 0 auto;
  width: 100%;
  height: 1px;
  background: #e8e9ef;
`;

export const RailHeaderName = styled.div`
  min-width: 0;
  overflow: hidden;
  color: #4276ff;
  font-size: 18px;
  font-weight: 700;
  line-height: 23px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RailHeaderLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: ${({ $compact }) => ($compact ? '15px' : '16px')};
  overflow: hidden;
  color: #6f76a7;
  font-size: ${({ $compact }) => ($compact ? '12px' : '13px')};
  font-weight: 500;
  line-height: normal;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong {
    color: #0a1551;
    font-weight: 700;
  }
`;

export const RailTabsWrap = styled.div`
  flex: 0 0 auto;
  min-width: 0;
  background: #ffffff;
  border-bottom: 1px solid #eceef1;

  [role='tablist'] {
    overflow: hidden;
    height: auto;
    min-height: 3rem;
  }

  [role='tab'] {
    width: auto;
    min-width: 0;
    flex: 1 1 0;
    height: auto;
    padding: 8px 4px;
    white-space: normal;
    text-align: center;
    font-size: clamp(10px, 0.55vw + 8px, 13px);
    line-height: 1.25;
  }
`;

export const RailPanels = styled.div`
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding: 14px 14px 20px;
  overflow-x: hidden;
  overflow-y: auto;

  @media (max-width: 1180px) {
    overflow: visible;
  }
`;
