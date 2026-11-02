import React from 'react';
import styled from 'styled-components';

export const NoteMention = styled.span`
  color: #1463ff;
`;

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Intern mention mail resolves `@username` tokens (`[A-Za-z0-9_-]+`). Display
// names stay in the picker; the inserted token must be the directory username.
export const getReviewerMentionHandle = user => {
  const username = String(user?.username || '').trim();
  if (username) {
    return username;
  }
  return String(user?.name || '').trim();
};

const getMentionNames = users => {
  const tokens = new Set();
  (Array.isArray(users) ? users : []).forEach(user => {
    const handle = getReviewerMentionHandle(user);
    if (handle) {
      tokens.add(handle);
    }
    const name = String(user?.name || '').trim();
    if (name) {
      tokens.add(name);
    }
  });
  return [...tokens].sort((left, right) => right.length - left.length);
};

export const renderReviewerMentions = (
  text,
  users,
  keyPrefix,
  requireTrailingWhitespace = false
) => {
  const mentionNames = getMentionNames(users);
  if (mentionNames.length === 0) {
    return text;
  }
  const boundary = requireTrailingWhitespace ? '(?=\\s)' : '(?![\\p{L}\\p{N}-])';
  const pattern = new RegExp(
    `@(?:${mentionNames.map(escapeRegExp).join('|')})${boundary}`,
    'gu'
  );
  const parts = [];
  let textIndex = 0;
  let match = pattern.exec(text);
  while (match) {
    if (match.index > textIndex) {
      parts.push(text.slice(textIndex, match.index));
    }
    parts.push(
      <NoteMention key={`${keyPrefix}-${match.index}`}>{match[0]}</NoteMention>
    );
    textIndex = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (textIndex < text.length) {
    parts.push(text.slice(textIndex));
  }
  return parts;
};
