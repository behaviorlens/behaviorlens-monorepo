import styled from 'styled-components';
import { FilterItem } from './ScBehaviorLensSessionListPage';

export const ToggleFilterItem = styled(FilterItem)`
  min-height: 62px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

export const FilterToggleControl = styled.div`
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: #475569;
`;

export const FilterStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: ${({ $error }) => ($error ? '#9b3d32' : '#64748b')};
`;

export const FilterRetryButton = styled.button`
  appearance: none;
  border: 0;
  padding: 0;
  color: #1463ff;
  background: transparent;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;
