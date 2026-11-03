import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const SessionRowLink = styled(Link)`
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 2px;

  &:focus-visible {
    outline: 2px solid #1463ff;
    outline-offset: -2px;
  }
`;

export const SessionNewTabLink = styled(Link)`
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  margin: -3px 0;
  border-radius: 6px;
  color: #64748b;
  text-decoration: none;
  transition: color 120ms ease, background-color 120ms ease;

  &:hover {
    color: #1463ff;
    background: #eaf2ff;
  }

  &:focus-visible {
    outline: 2px solid #1463ff;
    outline-offset: 1px;
  }
`;

export const SessionPageContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
`;
