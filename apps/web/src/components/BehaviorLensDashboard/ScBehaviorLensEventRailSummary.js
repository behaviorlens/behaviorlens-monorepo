import styled from 'styled-components';

export const RailSummaryBlock = styled.div`
  display: contents;
`;

export const RailKpiRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  flex: 0 0 auto;
`;

export const RailKpiCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  height: 100px;
  padding: 16px;
  border: 1px solid #fbd4a4;
  border-radius: 12px;
  background: #ffffff;
`;

export const RailKpiTitle = styled.div`
  color: #6f76a7;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
`;

export const RailKpiValue = styled.div`
  overflow: hidden;
  color: ${({ $tone }) => ($tone === 'high' ? '#c2410c' : '#0a1551')};
  font-size: 22px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RailKpiSub = styled.div`
  color: #6f76a7;
  font-size: 11px;
`;

export const RailSummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px;
  overflow: auto;
  border: 1px solid #fbd4a5;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04);
`;

export const RailSummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const RailSummaryKey = styled.span`
  flex: 0 0 130px;
  color: #6f76a7;
  font-size: 12px;
  font-weight: 500;
`;

export const RailSummaryValue = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${({ $link }) => ($link ? '#4276ff' : '#0a1551')};
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RailSummaryLink = styled.a`
  min-width: 0;
  overflow: hidden;
  color: #4276ff;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;
