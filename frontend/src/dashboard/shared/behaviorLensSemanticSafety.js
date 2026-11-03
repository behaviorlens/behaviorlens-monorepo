// Intentional: these recording-controlled characters are removed from labels.
// eslint-disable-next-line no-control-regex
const UNSAFE_LABEL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/gu;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
const IPV4_CANDIDATE_PATTERN = /(?:^|[^\d])((?:\d{1,3}\.){3}\d{1,3})(?=$|[^\d])/gu;
const IPV6_PATTERN = /(?:^|[^A-Fa-f0-9:])((?:[A-Fa-f0-9]{0,4}:){2,7}[A-Fa-f0-9]{0,4})(?=$|[^A-Fa-f0-9:])/u;
const URL_WITH_PRIVATE_PART_PATTERN = /(?:(?:https?:\/\/|www\.|\/)[^\s?#]*|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s?#]*)?)[?#][^\s]*/iu;
const API_KEY_PATTERN = /\bsk-[A-Za-z0-9_-]{12,}\b/u;
const BEARER_TOKEN_PATTERN = /\bbearer\s+[A-Za-z0-9._~+/-]{8,}={0,2}(?=$|\s)/iu;
const JWT_PATTERN = /\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/u;
const CREDENTIAL_ASSIGNMENT_PATTERN = /\b(?:api[ _-]?key|access[ _-]?token|auth[ _-]?token|bearer|client[ _-]?secret|password|passwd|secret)\b\s*[:=]\s*\S{4,}/iu;
const LONG_TOKEN_CANDIDATE_PATTERN = /[A-Za-z0-9_+/-]{32,}={0,2}/gu;
const PHONE_CANDIDATE_PATTERN = /\+?\d[\d\s().-]{5,}\d/gu;

export const SEMANTIC_LABEL_MAX_LENGTH = 120;

export const normalizeSemanticLabel = (value, maxLength = SEMANTIC_LABEL_MAX_LENGTH) => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value
    .replace(UNSAFE_LABEL_CHARACTERS, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, Math.max(0, maxLength));
  return normalized || null;
};

const containsIpv4Address = value => Array.from(value.matchAll(IPV4_CANDIDATE_PATTERN))
  .some(match => match[1].split('.').every(part => Number(part) >= 0 && Number(part) <= 255));

const containsLongToken = value => Array.from(value.matchAll(LONG_TOKEN_CANDIDATE_PATTERN))
  .some(match => {
    const token = match[0].replace(/=+$/u, '');
    const hasLetter = /[A-Za-z]/u.test(token);
    const hasDigit = /\d/u.test(token);
    const hasMixedCase = /[a-z]/u.test(token) && /[A-Z]/u.test(token);
    const hasTokenPunctuation = /[_+/-]/u.test(token);
    const characterVariety = new Set(token.toLowerCase()).size;
    return hasLetter && hasDigit
      && (hasMixedCase || hasTokenPunctuation || /^[A-Fa-f0-9]+$/u.test(token)
        || characterVariety >= 10);
  });

const containsPhoneNumber = value => Array.from(value.matchAll(PHONE_CANDIDATE_PATTERN))
  .some(match => {
    const candidate = match[0];
    const digitCount = (candidate.match(/\d/gu) || []).length;
    return digitCount >= 7 && digitCount <= 15
      && (candidate.startsWith('+') || /[\s().-]/u.test(candidate));
  });

export const containsSensitiveSemanticString = value => {
  if (typeof value !== 'string') return false;
  const normalized = normalizeSemanticLabel(value, value.length);
  if (!normalized) return false;
  return EMAIL_PATTERN.test(normalized)
    || containsIpv4Address(normalized)
    || IPV6_PATTERN.test(normalized)
    || URL_WITH_PRIVATE_PART_PATTERN.test(normalized)
    || API_KEY_PATTERN.test(normalized)
    || BEARER_TOKEN_PATTERN.test(normalized)
    || JWT_PATTERN.test(normalized)
    || CREDENTIAL_ASSIGNMENT_PATTERN.test(normalized)
    || containsLongToken(normalized)
    || containsPhoneNumber(normalized);
};

// Page-controlled semantic strings cross the AI privacy boundary only through
// this function. Unsafe values are dropped whole instead of partially exposed.
export const sanitizeSemanticString = (value, maxLength = SEMANTIC_LABEL_MAX_LENGTH) => {
  if (typeof value !== 'string' || containsSensitiveSemanticString(value)) return null;
  return normalizeSemanticLabel(value, maxLength);
};

export const sanitizeCustomEventTag = value => {
  const normalized = sanitizeSemanticString(value, 80);
  if (!normalized) {
    return null;
  }
  return normalized.replace(/[^a-zA-Z0-9:_-]/gu, '-');
};

export const sanitizeRecordingStatus = value => {
  const normalized = normalizeSemanticLabel(value, 32)?.toLowerCase();
  return ['active', 'completed', 'failed', 'stopped', 'unknown'].includes(normalized)
    ? normalized
    : 'unknown';
};

// This module deliberately sanitizes individual allowlisted scalar fields. It
// never recursively cleans a replay object: unknown fields are not copied.
export const sanitizeProductArea = value => sanitizeSemanticString(value, 64);
