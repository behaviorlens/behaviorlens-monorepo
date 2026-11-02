import styled from 'styled-components';

const VISITOR_CONTEXT_COLORS = {
  'New visitor': '#4276ff',
  'Returning visitor': '#7c49d8',
  Organic: '#16a34a',
  Referral: '#4f46e5'
};

export const VisitorContextLabels = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
`;

export const VisitorContextLabel = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  height: 16px;
  color: ${({ children }) => VISITOR_CONTEXT_COLORS[children] || '#4276ff'};
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & + &::before {
    width: 1px;
    height: 12px;
    margin-right: 4px;
    border-radius: 999px;
    background: #9ca3b3;
    content: '';
    flex: 0 0 auto;
  }
`;
